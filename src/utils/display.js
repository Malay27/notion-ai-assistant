/**
 * CLI Display Utility - Handles beautiful terminal output
 * 
 * @author Malay
 * @version 1.0.0-beta
 */

import chalk from 'chalk';
import boxen from 'boxen';

export class CLIDisplay {
    constructor() {
        this.brand = chalk.blue.bold('Noto');
        this.version = '1.0.0-beta';
    }

    /**
     * Show welcome message
     */
    showWelcome() {
        console.clear();
        
        const welcome = boxen(
            `🤖 ${this.brand} AI Assistant\n\n` +
            `${chalk.gray('Your intelligent Notion task manager')}\n\n` +
            `${chalk.gray('Version:')} ${this.version}\n\n` +
            `${chalk.green('Ready to help you manage tasks and jobs!')}`,
            {
                padding: 1,
                margin: 1,
                borderStyle: 'round',
                borderColor: 'blue',
                textAlignment: 'center'
            }
        );
        
        console.log(welcome);
    }

    /**
     * Show goodbye message
     */
    showGoodbye() {
        console.log(boxen(
            `👋 Thanks for using ${this.brand}!\n\n` +
            `${chalk.gray('Have a productive day!')}`,
            {
                padding: 1,
                margin: 1,
                borderStyle: 'round',
                borderColor: 'green',
                textAlignment: 'center'
            }
        ));
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        console.log(chalk.green(`✅ ${message}`));
    }

    /**
     * Show error message
     */
    showError(message) {
        console.log(chalk.red(`❌ ${message}`));
    }

    /**
     * Show info message
     */
    showInfo(message) {
        console.log(chalk.blue(`ℹ️  ${message}`));
    }

    /**
     * Show warning message
     */
    showWarning(message) {
        console.log(chalk.yellow(`⚠️  ${message}`));
    }

    /**
     * Show processing message
     */
    showProcessing(message) {
        console.log(chalk.gray(`⏳ ${message}`));
    }

    /**
     * Show command interpretation
     */
    showInterpretation(action, entities, confidence, aiAnalysis) {
        console.log(chalk.blue('\n🔍 Command Interpretation:'));
        console.log(`${chalk.gray('Action:')} ${chalk.cyan(action)}`);
        console.log(`${chalk.gray('Confidence:')} ${this.getConfidenceColor(confidence)}`);
        console.log(`${chalk.gray('AI Model:')} ${chalk.magenta(aiAnalysis.model)}`);
        console.log(`${chalk.gray('Method:')} ${chalk.magenta(aiAnalysis.method)}`);
        
        console.log(chalk.blue('\n📋 Extracted Details:'));
        
        if (action === 'addJob') {
            console.log(`${chalk.gray('Company:')} ${entities.company || 'N/A'}`);
            console.log(`${chalk.gray('Position:')} ${entities.title || entities.position || 'N/A'}`);
            if (entities.applicationLink) {
                console.log(`${chalk.gray('Application Link:')} ${entities.applicationLink}`);
            }
            if (entities.resumeUsed) {
                console.log(`${chalk.gray('Resume Used:')} ${entities.resumeUsed}`);
            }
            if (entities.notes) {
                console.log(`${chalk.gray('Notes:')} ${entities.notes}`);
            }
            if (entities.nextStep) {
                console.log(`${chalk.gray('Next Step:')} ${entities.nextStep}`);
            }
        } else {
            console.log(`${chalk.gray('Task:')} ${entities.title || 'N/A'}`);
            console.log(`${chalk.gray('Due Date:')} ${entities.dueDate || 'N/A'}`);
            console.log(`${chalk.gray('Priority:')} ${this.getPriorityColor(entities.priority)}`);
            if (entities.status) {
                console.log(`${chalk.gray('Status:')} ${this.getStatusColor(entities.status)}`);
            }
        }
        console.log();
    }

    /**
     * Show search results
     */
    showSearchResults(results) {
        if (!results.success) {
            this.showError(`Search failed: ${results.error}`);
            return;
        }

        const items = results.data;
        
        if (items.length === 0) {
            this.showInfo('No results found.');
            return;
        }

        console.log(chalk.blue(`\n🔍 Found ${items.length} result(s):\n`));
        
        items.forEach((item, index) => {
            console.log(chalk.cyan(`${index + 1}. ${item.title}`));
            
            if (item.company) {
                console.log(`   ${chalk.gray('Company:')} ${item.company}`);
            }
            
            if (item.status) {
                console.log(`   ${chalk.gray('Status:')} ${this.getStatusColor(item.status)}`);
            }
            
            if (item.priority) {
                console.log(`   ${chalk.gray('Priority:')} ${this.getPriorityColor(item.priority)}`);
            }
            
            if (item.category) {
                console.log(`   ${chalk.gray('Category:')} ${item.category}`);
            }
            
            if (item.dueDate) {
                console.log(`   ${chalk.gray('Due Date:')} ${item.dueDate}`);
            }
            
            console.log();
        });
    }

    /**
     * Show dashboard
     */
    showDashboard(tasks, jobs) {
        console.log(boxen(
            `📊 ${this.brand} Dashboard`,
            {
                padding: { top: 0, bottom: 0, left: 1, right: 1 },
                margin: 1,
                borderStyle: 'round',
                borderColor: 'blue',
                textAlignment: 'center'
            }
        ));

        // Recent Tasks
        console.log(chalk.blue('\n📋 Recent Tasks:'));
        if (tasks.success && tasks.data.length > 0) {
            tasks.data.forEach((task, index) => {
                console.log(`${index + 1}. ${task.title}`);
                console.log(`   ${chalk.gray('Status:')} ${this.getStatusColor(task.status)} ${chalk.gray('Priority:')} ${this.getPriorityColor(task.priority)}`);
                if (task.dueDate) {
                    console.log(`   ${chalk.gray('Due:')} ${task.dueDate}`);
                }
                console.log();
            });
        } else {
            console.log(chalk.gray('   No recent tasks.'));
        }

        // Recent Jobs
        console.log(chalk.blue('\n💼 Recent Job Applications:'));
        if (jobs.success && jobs.data.length > 0) {
            jobs.data.forEach((job, index) => {
                console.log(`${index + 1}. ${job.title}`);
                console.log(`   ${chalk.gray('Company:')} ${job.company} ${chalk.gray('Status:')} ${this.getStatusColor(job.status)}`);
                console.log();
            });
        } else {
            console.log(chalk.gray('   No recent job applications.'));
        }

        console.log();
    }

    /**
     * Get confidence color
     */
    getConfidenceColor(confidence) {
        switch (confidence?.toLowerCase()) {
            case 'high':
                return chalk.green(confidence);
            case 'medium':
                return chalk.yellow(confidence);
            case 'low':
                return chalk.red(confidence);
            default:
                return chalk.gray(confidence || 'Unknown');
        }
    }

    /**
     * Get priority color
     */
    getPriorityColor(priority) {
        switch (priority?.toLowerCase()) {
            case 'high':
                return chalk.red(priority);
            case 'medium':
                return chalk.yellow(priority);
            case 'low':
                return chalk.green(priority);
            default:
                return chalk.gray(priority || 'Medium');
        }
    }

    /**
     * Show task list
     */
    showTaskList(tasks, title = 'Tasks') {
        if (!tasks || tasks.length === 0) {
            this.showInfo(`No ${title.toLowerCase()} found.`);
            return;
        }

        console.log(chalk.blue.bold(`\n📋 ${title} (${tasks.length})`));
        console.log(chalk.gray('─'.repeat(50)));

        tasks.forEach((task, index) => {
            const statusColor = this.getStatusColor(task.status);
            const priorityIcon = this.getPriorityIcon(task.priority);
            const dueDate = task.dueDate ? chalk.cyan(`📅 ${task.dueDate}`) : '';
            
            console.log(
                `${chalk.gray(`${index + 1}.`)} ${chalk.white.bold(task.title)}\n` +
                `   ${statusColor} ${priorityIcon} ${dueDate}`
            );
        });
        console.log('');
    }

    /**
     * Get priority icon
     */
    getPriorityIcon(priority) {
        switch (priority?.toLowerCase()) {
            case 'highest':
                return chalk.red('🔴 Highest');
            case 'high':
                return chalk.red('🟠 High');
            case 'medium':
                return chalk.yellow('🟡 Medium');
            case 'low':
                return chalk.green('🟢 Low');
            case 'lowest':
                return chalk.gray('⚪ Lowest');
            default:
                return chalk.gray('⚫ Unknown');
        }
    }

    /**
     * Get status color
     */
    getStatusColor(status) {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'done':
                return chalk.green(status);
            case 'in progress':
            case 'working':
                return chalk.yellow(status);
            case 'not started':
            case 'todo':
                return chalk.red(status);
            case 'applied':
                return chalk.blue(status);
            default:
                return chalk.gray(status || 'Unknown');
        }
    }
}

// Create and export service instance
const display = new CLIDisplay();
export { display };
