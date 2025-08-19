#!/usr/bin/env node

/**
 * Noto AI Assistant - Main Entry Point
 * 
 * @author Malay
 * @version 1.0.0-beta
 */

import { NotoCLI } from './src/cli/index.js';

// Start the CLI application
const cli = new NotoCLI();
cli.start().catch(error => {
    console.error(`Failed to start Noto CLI: ${error.message}`);
    process.exit(1);
});
