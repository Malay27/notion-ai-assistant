/**
 * Noto AI Assistant - Main Entry Point
 *
 * This is the main entry point for the application.
 * Tests foundation setup and API connectivity.
 *
 * @author Malay
 * @version 1.0.0-beta
 */

import dotenv from "dotenv";
import { HfInference } from "@huggingface/inference";
import { Client } from "@notionhq/client";
import chalk from "chalk";
import CommandInterpreter from "./ai/commandInterpreter.js"; // ✅ Simple interpreter ready!

// Load environment variables
dotenv.config();

console.log(chalk.blue.bold("🤖 Noto AI Assistant"));
console.log(chalk.green("📋 Phase 1: Project Foundation Complete!"));
console.log(
  chalk.yellow("🔜 Next: Implementing Hugging Face Command Interpreter...")
);

/**
 * Test environment configuration
 */
function testEnvironment() {
  console.log(chalk.cyan("\n🔍 Testing Environment Configuration..."));

  const requiredVars = [
    "HUGGINGFACE_API_KEY",
    "NOTION_TOKEN",
    "TODO_DATABASE_ID",
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    console.log(
      chalk.red(`❌ Missing environment variables: ${missing.join(", ")}`)
    );
    console.log(chalk.yellow("📝 Please check your .env file"));
    return false;
  }

  console.log(chalk.green("✅ All required environment variables are set"));
  return true;
}

/**
 * Test Hugging Face API connectivity
 */
async function testHuggingFace() {
  console.log(chalk.cyan("\n🤗 Testing Hugging Face API..."));

  const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

  try {
    // Test with DistilBART summarization (primary test)
    console.log(chalk.gray("   Testing with DistilBART summarization model..."));

    const response = await hf.summarization({
      model: "sshleifer/distilbart-cnn-12-6",
      inputs: "Hugging Face is a company that builds tools for natural language processing. They provide state-of-the-art machine learning models and tools for developers and researchers around the world. The platform offers both free and paid tiers for accessing various AI models.",
    });

    console.log(chalk.green("✅ Hugging Face API connection successful"));
    console.log(chalk.gray(`   Summary: "${response.summary_text}"`));
    return true;
  } catch (error) {
    console.log(chalk.yellow("⚠️  DistilBART test failed, trying sentiment analysis fallback..."));

    // Fallback test with sentiment analysis
    try {
      const response = await hf.textClassification({
        model: "distilbert/distilbert-base-uncased-finetuned-sst-2-english",
        inputs: "I love using AI tools for productivity and automation!"
      });

      console.log(chalk.green("✅ Hugging Face API connection successful (sentiment analysis)"));
      console.log(chalk.gray(`   Sentiment: ${response[0].label} (${(response[0].score * 100).toFixed(1)}% confidence)`));
      return true;
    } catch (fallbackError) {
      console.log(chalk.red("❌ Hugging Face API connection failed"));
      console.log(chalk.red(`   DistilBART error: ${error.message}`));
      console.log(chalk.red(`   Sentiment analysis error: ${fallbackError.message}`));
      console.log(chalk.yellow("   💡 Please check your API key and try different models"));
      return false;
    }
  }
}

/**
 * Test Command Interpreter
 */
async function testCommandInterpreter() {
  console.log(chalk.cyan('\n🧠 Testing Command Interpreter...'));
  
  try {
    const interpreter = new CommandInterpreter();
    
    // Test commands
    const testCommands = [
      "Add task to review code by tomorrow",
      "Show me today's tasks", 
      "Mark team meeting as done",
      "Add Google software engineer application"
    ];
    
    console.log(chalk.gray('   Testing with sample commands...'));
    
    for (const command of testCommands) {
      console.log(chalk.blue(`\n   Input: "${command}"`));
      const result = await interpreter.interpretCommand(command);
      console.log(chalk.green(`   Action: ${result.action}`));
      console.log(chalk.gray(`   Entities: ${JSON.stringify(result.entities, null, 2)}`));
    }
    
    console.log(chalk.green('\n✅ Command Interpreter test successful'));
    return true;
    
  } catch (error) {
    console.log(chalk.red('❌ Command Interpreter test failed'));
    console.log(chalk.red(`   Error: ${error.message}`));
    return false;
  }
}
async function testNotion() {
  console.log(chalk.cyan("\n📝 Testing Notion API..."));

  try {
    const notion = new Client({
      auth: process.env.NOTION_TOKEN,
    });

    // Test by querying the todo database
    const response = await notion.databases.query({
      database_id: process.env.TODO_DATABASE_ID,
      page_size: 1,
    });

    console.log(chalk.green("✅ Notion API connection successful"));
    console.log(
      chalk.gray(
        `   Database has ${response.results.length > 0 ? "existing data" : "no data yet"}`
      )
    );
    return true;
  } catch (error) {
    console.log(chalk.red("❌ Notion API connection failed"));
    console.log(chalk.red(`   Error: ${error.message}`));
    return false;
  }
}

/**
 * Main test function
 */
export default async function main() {
  console.log(chalk.blue("\n🔧 Running Foundation Tests...\n"));

  // Test environment
  const envOk = testEnvironment();
  if (!envOk) {
    process.exit(1);
  }

  // Test APIs  
  const [hfOk, interpreterOk, notionOk] = await Promise.all([
    testHuggingFace(), 
    testCommandInterpreter(),
    testNotion()
  ]);

  // Summary
  console.log(chalk.blue("\n📊 Test Results:"));
  console.log(
    `Environment: ${envOk ? chalk.green("✅ OK") : chalk.red("❌ FAIL")}`
  );
  console.log(
    `Hugging Face: ${hfOk ? chalk.green("✅ OK") : chalk.red("❌ FAIL")}`
  );
  console.log(
    `Command Interpreter: ${interpreterOk ? chalk.green("✅ OK") : chalk.red("❌ FAIL")}`
  );
  console.log(
    `Notion API: ${notionOk ? chalk.green("✅ OK") : chalk.red("❌ FAIL")}`
  );

  if (envOk && hfOk && interpreterOk && notionOk) {
    console.log(
      chalk.green.bold("\n🎉 Foundation is ready! Ready for Phase 2.")
    );
    console.log(chalk.yellow("📖 Check README.md for next steps"));
  } else {
    console.log(
      chalk.red.bold("\n⚠️  Please fix the failing tests before proceeding")
    );
  }
}

// Run if this file is executed directly
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(chalk.red("💥 Error running tests:"), error);
    process.exit(1);
  });
}
