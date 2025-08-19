/**
 * Noto AI Assistant - Main CLI Application
 * Interactive command-line interface for Notion task management
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import boxen from 'boxen';
import { commandInterpreter } from '../ai/commandInterpreter.js';
import { notionService } from '../services/notion.js';
import { backendService } from '../services/backend.js';
import { display } from '../utils/display.js';
import { config } from '../config/index.js';

class NotoCLI {
    constructor() {
        this.running = false;
        this.session = {
            startTime: new Date(),
            commandCount: 0,
            lastAction: null
        };
    }

    async start() {
        this.running = true;
        this.displayWelcome();
        
        // Check backend connection
        await this.checkBackend();
        
        // Main CLI loop
        while (this.running) {
            try {
                await this.mainMenu();
            } catch (error) {
                console.error(chalk.red('Error in CLI:'), error.message);
                await this.promptContinue();
            }
        }
    }

    displayWelcome() {
        const welcome = boxen(
            chalk.bold.blue('🎯 Noto: Your AI Notion Assistant') + '\n\n' +
            chalk.gray('Turn natural language into organized tasks and job applications.') + '\n' +
            chalk.gray('Type your commands naturally, and let AI handle the rest!') + '\n\n' +
            chalk.dim('💡 Examples:') + '\n' +
            chalk.dim('  • "Add urgent task to review code by tomorrow"') + '\n' +
            chalk.dim('  • "Apply for software engineer job at Google"') + '\n' +
            chalk.dim('  • "Find all high priority tasks"'),
            {
                padding: 1,
                margin: 1,
                borderStyle: 'round',
                borderColor: 'blue',
                backgroundColor: 'black'
            }
        );
        
        console.log(welcome);
    }

    async checkBackend() {
        try {
            display.info('Checking backend connection...');
            const status = await backendService.healthCheck();
            
            if (status.status === 'running') {
                display.success(`Backend connected: ${status.ai_model} (${status.model_status})`);
            } else {
                display.warning('Backend not responding, using fallback mode');
            }
        } catch (error) {
            display.error('Backend connection failed, using local processing');
        }
    }

    async mainMenu() {
        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What would you like to do?',
                choices: [
                    { name: '💬 Enter natural language command', value: 'command' },
                    { name: '📝 View recent tasks', value: 'view_tasks' },
                    { name: '💼 View job applications', value: 'view_jobs' },
                    { name: '🔍 Search', value: 'search' },
                    { name: '⚙️  Settings', value: 'settings' },
                    { name: '❌ Exit', value: 'exit' }
                ]
            }
        ]);

        switch (action) {
            case 'command':
                await this.handleCommand();
                break;
            case 'view_tasks':
                await this.viewTasks();
                break;
            case 'view_jobs':
                await this.viewJobs();
                break;
            case 'search':
                await this.handleSearch();
                break;
            case 'settings':
                await this.showSettings();
                break;
            case 'exit':
                await this.exit();
                break;
        }
    }

    async handleCommand() {
        const { command } = await inquirer.prompt([
            {
                type: 'input',
                name: 'command',
                message: '💬 Enter your command:',
                validate: (input) => input.trim() ? true : 'Please enter a command'
            }
        ]);

        display.info('Processing command...');
        
        try {
            // Interpret command using backend
            const interpretation = await backendService.interpretCommand(command);
            
            // Display interpretation
            this.displayInterpretation(interpretation);
            
            // Confirm and execute
            const { confirm } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: 'Execute this action?',
                    default: true
                }
            ]);

            if (confirm) {
                await this.executeAction(interpretation);
                this.session.commandCount++;
                this.session.lastAction = interpretation.action;
            }
        } catch (error) {
            display.error('Failed to process command:', error.message);
        }

        await this.promptContinue();
    }

    displayInterpretation(interpretation) {
        const { action, entities, confidence, ai_analysis } = interpretation;
        
        console.log('\n' + chalk.bold('🤖 AI Interpretation:'));
        console.log(chalk.blue(`Action: ${action}`));
        console.log(chalk.green(`Title: ${entities.title}`));
        
        if (entities.dueDate) {
            console.log(chalk.yellow(`Due Date: ${entities.dueDate}`));
        }
        
        if (entities.priority) {
            const priorityColor = entities.priority === 'high' ? chalk.red : 
                                entities.priority === 'medium' ? chalk.yellow : chalk.green;
            console.log(priorityColor(`Priority: ${entities.priority}`));
        }
        
        if (entities.category) {
            console.log(chalk.cyan(`Category: ${entities.category}`));
        }
        
        console.log(chalk.gray(`Confidence: ${confidence}`));
        console.log(chalk.dim(`Model: ${ai_analysis.model} (${ai_analysis.method})`));
    }

    async executeAction(interpretation) {
        const { action, entities } = interpretation;
        
        try {
            switch (action) {
                case 'addTask':
                    await this.addTask(entities);
                    break;
                case 'addJob':
                    await this.addJob(entities);
                    break;
                case 'searchTask':
                    await this.searchTasks(entities);
                    break;
                case 'updateTask':
                    display.info('Task update feature coming soon!');
                    break;
                case 'deleteTask':
                    display.info('Task deletion feature coming soon!');
                    break;
                default:
                    display.warning(`Action ${action} not yet implemented`);
            }
        } catch (error) {
            display.error('Failed to execute action:', error.message);
        }
    }

    async addTask(entities) {
        display.info('Creating task in Notion...');
        
        try {
            const result = await notionService.createTask({
                title: entities.title,
                dueDate: entities.dueDate,
                priority: entities.priority,
                category: entities.category
            });
            
            display.success('✅ Task created successfully!');
            console.log(chalk.dim(`Task ID: ${result.id}`));
        } catch (error) {
            display.error('Failed to create task:', error.message);
        }
    }

    async addJob(entities) {
        display.info('Creating job application in Notion...');
        
        try {
            const result = await notionService.createJob({
                title: entities.title,
                priority: entities.priority,
                category: entities.category
            });
            
            display.success('💼 Job application created successfully!');
            console.log(chalk.dim(`Job ID: ${result.id}`));
        } catch (error) {
            display.error('Failed to create job application:', error.message);
        }
    }

    async viewTasks() {
        display.info('Fetching tasks from Notion...');
        
        try {
            const tasks = await notionService.getTasks();
            
            if (tasks.length === 0) {
                display.info('No tasks found. Create some tasks first!');
                return;
            }
            
            console.log(chalk.bold('\n📝 Recent Tasks:'));
            tasks.forEach((task, index) => {
                const priority = task.priority ? chalk.yellow(`[${task.priority}]`) : '';
                const dueDate = task.dueDate ? chalk.gray(`(Due: ${task.dueDate})`) : '';
                console.log(`${index + 1}. ${priority} ${task.title} ${dueDate}`);
            });
        } catch (error) {
            display.error('Failed to fetch tasks:', error.message);
        }
        
        await this.promptContinue();
    }

    async viewJobs() {
        display.info('Fetching job applications from Notion...');
        
        try {
            const jobs = await notionService.getJobs();
            
            if (jobs.length === 0) {
                display.info('No job applications found. Add some job applications first!');
                return;
            }
            
            console.log(chalk.bold('\n💼 Job Applications:'));
            jobs.forEach((job, index) => {
                const priority = job.priority ? chalk.yellow(`[${job.priority}]`) : '';
                console.log(`${index + 1}. ${priority} ${job.title}`);
            });
        } catch (error) {
            display.error('Failed to fetch job applications:', error.message);
        }
        
        await this.promptContinue();
    }

    async searchTasks(entities) {
        display.info('Searching tasks...');
        
        try {
            const results = await notionService.searchTasks(entities.title);
            
            if (results.length === 0) {
                display.info('No matching tasks found.');
                return;
            }
            
            console.log(chalk.bold('\n🔍 Search Results:'));
            results.forEach((task, index) => {
                console.log(`${index + 1}. ${task.title}`);
            });
        } catch (error) {
            display.error('Failed to search tasks:', error.message);
        }
    }

    async handleSearch() {
        const { query } = await inquirer.prompt([
            {
                type: 'input',
                name: 'query',
                message: '🔍 Search for:',
                validate: (input) => input.trim() ? true : 'Please enter a search query'
            }
        ]);

        await this.searchTasks({ title: query });
        await this.promptContinue();
    }

    async showSettings() {
        const stats = {
            sessionTime: Math.floor((new Date() - this.session.startTime) / 1000),
            commandCount: this.session.commandCount,
            lastAction: this.session.lastAction || 'None'
        };

        console.log(chalk.bold('\n⚙️  Settings & Status:'));
        console.log(chalk.blue(`Backend URL: ${config.backend.url}`));
        console.log(chalk.green(`Session Duration: ${stats.sessionTime}s`));
        console.log(chalk.yellow(`Commands Executed: ${stats.commandCount}`));
        console.log(chalk.cyan(`Last Action: ${stats.lastAction}`));
        
        await this.promptContinue();
    }

    async promptContinue() {
        await inquirer.prompt([
            {
                type: 'input',
                name: 'continue',
                message: 'Press Enter to continue...'
            }
        ]);
    }

    async exit() {
        console.log(chalk.bold.green('\n👋 Thanks for using Noto AI Assistant!'));
        console.log(chalk.gray(`Session Stats: ${this.session.commandCount} commands in ${Math.floor((new Date() - this.session.startTime) / 1000)}s`));
        this.running = false;
    }
}

export { NotoCLI };
