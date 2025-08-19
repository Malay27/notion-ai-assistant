#!/usr/bin/env node

/**
 * Noto AI Assistant - Command Line Interface
 * Interactive CLI for managing tasks and jobs through natural language
 * 
 * @author Malay
 * @version 1.0.0-beta
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import { NotionService } from '../services/notion.js';
import { BackendService } from '../services/backend.js';
import { CLIDisplay } from '../utils/display.js';

class NotoCLI {
    constructor() {
        this.backendService = new BackendService();
        this.notionService = new NotionService();
        this.display = new CLIDisplay();
        this.isRunning = false;
    }

    /**
     * Initialize and start the CLI
     */
    async start() {
        this.display.showWelcome();
        
        // Check backend connection
        const backendStatus = await this.backendService.getStatus();
        if (!backendStatus.available) {
            this.display.showError('Backend connection failed. Please ensure the Python backend is running.');
            return;
        }
        
        this.display.showSuccess(`Connected to backend: ${backendStatus.aiModel} (${backendStatus.modelStatus})`);
        
        this.isRunning = true;
        await this.mainLoop();
    }

    /**
     * Execute a single command directly without interactive mode
     */
    async executeDirect(command) {
        try {
            console.log(chalk.blue('🤖 Noto AI Assistant - Direct Command Mode'));
            console.log(chalk.gray(`Command: "${command}"\n`));
            
            // Check backend connection first
            const backendStatus = await this.backendService.getStatus();
            if (!backendStatus.available) {
                this.display.showError('Backend connection failed. Please ensure the Python backend is running.');
                return;
            }
            
            // Process the command
            await this.processNaturalLanguageCommand(command, true);
            
        } catch (error) {
            console.error(chalk.red(`Error executing command: ${error.message}`));
            process.exit(1);
        }
    }

    /**
     * Main interaction loop
     */
    async mainLoop() {
        while (this.isRunning) {
            try {
                const answers = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'action',
                        message: 'What would you like to do?',
                        choices: [
                            { name: '💬 Chat with Noto (Natural Language)', value: 'chat' },
                            { name: '📋 Quick Add Task', value: 'quickTask' },
                            { name: '💼 Quick Add Job Application', value: 'quickJob' },
                            { name: '🔍 Search Tasks', value: 'search' },
                            { name: '📊 View Dashboard', value: 'dashboard' },
                            { name: '⚙️  Settings', value: 'settings' },
                            { name: '🚪 Exit', value: 'exit' }
                        ]
                    }
                ]);

                await this.handleAction(answers.action);
                
            } catch (error) {
                this.display.showError(`CLI Error: ${error.message}`);
            }
        }
    }

    /**
     * Handle user action selection
     */
    async handleAction(action) {
        switch (action) {
            case 'chat':
                await this.handleChat();
                break;
            case 'quickTask':
                await this.handleQuickTask();
                break;
            case 'quickJob':
                await this.handleQuickJob();
                break;
            case 'search':
                await this.handleSearch();
                break;
            case 'dashboard':
                await this.handleDashboard();
                break;
            case 'settings':
                await this.handleSettings();
                break;
            case 'exit':
                this.handleExit();
                break;
            default:
                this.display.showError('Unknown action');
        }
    }

    /**
     * Handle natural language chat
     */
    async handleChat() {
        console.log(chalk.blue('\n🤖 Noto AI Assistant - Natural Language Mode'));
        console.log(chalk.gray('Type your commands naturally. Examples:'));
        console.log(chalk.gray('  • "Add urgent task to review code by tomorrow"'));
        console.log(chalk.gray('  • "Apply for software engineer job at Google"'));
        console.log(chalk.gray('  • "Show me my high priority tasks"'));
        console.log(chalk.gray('Type "back" to return to main menu\n'));

        while (true) {
            const { command } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'command',
                    message: 'You:',
                    prefix: '💬'
                }
            ]);

            if (command.toLowerCase() === 'back') {
                break;
            }

            if (command.trim()) {
                await this.processNaturalLanguageCommand(command);
            }
        }
    }

    /**
     * Process natural language command through backend
     */
    async processNaturalLanguageCommand(command, directMode = false) {
        try {
            this.display.showProcessing('Interpreting command...');
            
            // Send to backend for interpretation
            const interpretation = await this.backendService.interpretCommand(command);
            
            if (interpretation.success) {
                const { action, entities, confidence, ai_analysis } = interpretation.data;
                
                // Show interpretation
                this.display.showInterpretation(action, entities, confidence, ai_analysis);
                
                let proceed = true;
                
                // In interactive mode, ask for confirmation
                if (!directMode) {
                    const answer = await inquirer.prompt([
                        {
                            type: 'confirm',
                            name: 'proceed',
                            message: 'Does this look correct?',
                            default: true
                        }
                    ]);
                    proceed = answer.proceed;
                }

                if (proceed) {
                    await this.executeAction(action, entities);
                } else {
                    this.display.showInfo('Command cancelled.');
                }
            } else {
                this.display.showError(`Interpretation failed: ${interpretation.error}`);
            }
            
        } catch (error) {
            this.display.showError(`Command processing error: ${error.message}`);
        }
    }

    /**
     * Execute interpreted action
     */
    async executeAction(action, entities) {
        try {
            switch (action) {
                case 'addTask':
                case 'createTask':
                    const createResult = await this.notionService.createTask(entities);
                    if (createResult.success) {
                        this.display.showSuccess('✅ Task created successfully!');
                        this.display.showInfo(`📝 Title: ${entities.title || 'Untitled'}`);
                        if (entities.priority) this.display.showInfo(`🎯 Priority: ${entities.priority}`);
                        if (entities.dueDate) this.display.showInfo(`📅 Due: ${entities.dueDate}`);
                    } else {
                        this.display.showError(`Failed to create task: ${createResult.error}`);
                    }
                    break;

                case 'updateTask':
                case 'editTask':
                    if (entities.taskId) {
                        const updateResult = await this.notionService.updateTask(entities.taskId, entities);
                        if (updateResult.success) {
                            this.display.showSuccess('✅ Task updated successfully!');
                        } else {
                            this.display.showError(`Failed to update task: ${updateResult.error}`);
                        }
                    } else {
                        this.display.showError('Task ID required for updates');
                    }
                    break;

                case 'completeTask':
                case 'finishTask':
                    if (entities.taskId) {
                        const completeResult = await this.notionService.completeTask(entities.taskId);
                        if (completeResult.success) {
                            this.display.showSuccess('✅ Task marked as complete!');
                        } else {
                            this.display.showError(`Failed to complete task: ${completeResult.error}`);
                        }
                    } else {
                        this.display.showError('Task ID required to mark as complete');
                    }
                    break;

                case 'deleteTask':
                case 'removeTask':
                    if (entities.taskId) {
                        const deleteResult = await this.notionService.deleteTask(entities.taskId);
                        if (deleteResult.success) {
                            this.display.showSuccess('✅ Task deleted successfully!');
                        } else {
                            this.display.showError(`Failed to delete task: ${deleteResult.error}`);
                        }
                    } else {
                        this.display.showError('Task ID required for deletion');
                    }
                    break;

                case 'searchTask':
                case 'findTask':
                    const searchResult = await this.notionService.searchTasks(entities);
                    if (searchResult.success) {
                        this.display.showSearchResults(searchResult.data, 'Tasks');
                    } else {
                        this.display.showError(`Search failed: ${searchResult.error}`);
                    }
                    break;

                case 'listTasks':
                case 'showTasks':
                    const listResult = await this.notionService.getRecentTasks(10);
                    if (listResult.success) {
                        this.display.showTaskList(listResult.data);
                    } else {
                        this.display.showError(`Failed to get tasks: ${listResult.error}`);
                    }
                    break;

                case 'getTasksByStatus':
                    const statusResult = await this.notionService.getTasksByStatus(entities.status || 'Not started');
                    if (statusResult.success) {
                        this.display.showTaskList(statusResult.data, `${entities.status} Tasks`);
                    } else {
                        this.display.showError(`Failed to get tasks by status: ${statusResult.error}`);
                    }
                    break;

                case 'getTasksByPriority':
                    const priorityResult = await this.notionService.getTasksByPriority(entities.priority || 'High');
                    if (priorityResult.success) {
                        this.display.showTaskList(priorityResult.data, `${entities.priority} Priority Tasks`);
                    } else {
                        this.display.showError(`Failed to get tasks by priority: ${priorityResult.error}`);
                    }
                    break;

                case 'addJob':
                case 'createJob':
                    const jobResult = await this.notionService.createJobApplication(entities);
                    if (jobResult.success) {
                        this.display.showSuccess('✅ Job application added successfully!');
                    } else {
                        this.display.showError(`Failed to create job application: ${jobResult.error}`);
                    }
                    break;

                case 'searchJob':
                case 'findJob':
                    const jobSearchResult = await this.notionService.searchJobs(entities);
                    if (jobSearchResult.success) {
                        this.display.showSearchResults(jobSearchResult.data, 'Jobs');
                    } else {
                        this.display.showError(`Job search failed: ${jobSearchResult.error}`);
                    }
                    break;

                default:
                    this.display.showError(`Unknown action: ${action}`);
                    this.display.showInfo('Available actions: addTask, updateTask, completeTask, deleteTask, searchTask, listTasks, addJob, searchJob');
            }
        } catch (error) {
            this.display.showError(`Action execution error: ${error.message}`);
        }
    }

    /**
     * Handle quick task creation
     */
    async handleQuickTask() {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'title',
                message: 'Task title:',
                validate: input => input.trim() !== '' || 'Title is required'
            },
            {
                type: 'list',
                name: 'priority',
                message: 'Priority:',
                choices: ['High', 'Medium', 'Low'],
                default: 'Medium'
            },
            {
                type: 'list',
                name: 'status',
                message: 'Status:',
                choices: ['Todo', 'In Progress', 'Done'],
                default: 'Todo'
            },
            {
                type: 'input',
                name: 'dueDate',
                message: 'Due date (optional, e.g., "tomorrow", "next week"):'
            }
        ]);

        await this.executeAction('addTask', answers);
    }

    /**
     * Handle quick job application
     */
    async handleQuickJob() {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'company',
                message: 'Company name:',
                validate: input => input.trim() !== '' || 'Company name is required'
            },
            {
                type: 'input',
                name: 'position',
                message: 'Position/Role:',
                validate: input => input.trim() !== '' || 'Position is required'
            },
            {
                type: 'input',
                name: 'applicationLink',
                message: 'Application link (optional):'
            },
            {
                type: 'input',
                name: 'resumeUsed',
                message: 'Resume version used (optional):'
            },
            {
                type: 'input',
                name: 'notes',
                message: 'Additional notes (optional):'
            },
            {
                type: 'input',
                name: 'nextStep',
                message: 'Next step/follow-up (optional):'
            }
        ]);

        // Set title as position for consistency with AI interpretation
        answers.title = answers.position;
        
        await this.executeAction('addJob', answers);
    }

    /**
     * Handle search functionality
     */
    async handleSearch() {
        const { searchType } = await inquirer.prompt([
            {
                type: 'list',
                name: 'searchType',
                message: 'What would you like to search?',
                choices: [
                    { name: '📋 Tasks', value: 'tasks' },
                    { name: '💼 Job Applications', value: 'jobs' },
                    { name: '🔙 Back to Main Menu', value: 'back' }
                ]
            }
        ]);

        if (searchType === 'back') return;

        const { query } = await inquirer.prompt([
            {
                type: 'input',
                name: 'query',
                message: 'Search query (or press Enter for all):',
            }
        ]);

        try {
            if (searchType === 'tasks') {
                const tasks = await this.notionService.searchTasks({ title: query });
                this.display.showSearchResults(tasks);
            } else {
                const jobs = await this.notionService.searchJobs({ title: query });
                this.display.showSearchResults(jobs);
            }
        } catch (error) {
            this.display.showError(`Search error: ${error.message}`);
        }
    }

    /**
     * Handle dashboard view
     */
    async handleDashboard() {
        try {
            this.display.showProcessing('Loading dashboard...');
            
            const [tasks, jobs] = await Promise.all([
                this.notionService.getRecentTasks(),
                this.notionService.getRecentJobs()
            ]);
            
            this.display.showDashboard(tasks, jobs);
            
        } catch (error) {
            this.display.showError(`Dashboard error: ${error.message}`);
        }
    }

    /**
     * Handle settings
     */
    async handleSettings() {
        const { setting } = await inquirer.prompt([
            {
                type: 'list',
                name: 'setting',
                message: 'Settings:',
                choices: [
                    { name: '🔧 Backend Status', value: 'backend' },
                    { name: '📊 Notion Connection', value: 'notion' },
                    { name: '🔙 Back to Main Menu', value: 'back' }
                ]
            }
        ]);

        switch (setting) {
            case 'backend':
                await this.showBackendStatus();
                break;
            case 'notion':
                await this.showNotionStatus();
                break;
            case 'back':
                return;
        }
    }

    /**
     * Show backend status
     */
    async showBackendStatus() {
        try {
            const status = await this.backendService.checkHealth();
            if (status.success) {
                this.display.showSuccess('Backend Status: Connected');
                console.log(chalk.gray(`  • Service: ${status.data.service}`));
                console.log(chalk.gray(`  • Version: ${status.data.version}`));
                console.log(chalk.gray(`  • AI Model: ${status.data.ai_model}`));
                console.log(chalk.gray(`  • Model Status: ${status.data.model_status}`));
                console.log(chalk.gray(`  • Device: ${status.data.device}`));
            } else {
                this.display.showError('Backend Status: Disconnected');
            }
        } catch (error) {
            this.display.showError(`Backend check failed: ${error.message}`);
        }
    }

    /**
     * Show Notion connection status
     */
    async showNotionStatus() {
        try {
            const status = await this.notionService.checkConnection();
            if (status.success) {
                this.display.showSuccess('Notion Status: Connected');
                console.log(chalk.gray(`  • Databases accessible: ${status.data.databases}`));
            } else {
                this.display.showError('Notion Status: Connection failed');
            }
        } catch (error) {
            this.display.showError(`Notion check failed: ${error.message}`);
        }
    }

    /**
     * Handle exit
     */
    handleExit() {
        this.display.showGoodbye();
        this.isRunning = false;
        process.exit(0);
    }
}

// Start the CLI if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const cli = new NotoCLI();
    
    // Check if a command was passed as an argument
    const directCommand = process.argv[2];
    
    if (directCommand) {
        // Execute the command directly without interactive mode
        cli.executeDirect(directCommand).catch(error => {
            console.error(chalk.red(`Command execution error: ${error.message}`));
            process.exit(1);
        });
    } else {
        // Start interactive mode
        cli.start().catch(error => {
            console.error(chalk.red(`CLI startup error: ${error.message}`));
            process.exit(1);
        });
    }
}

export { NotoCLI };
