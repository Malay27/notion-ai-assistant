/**
 * Notion Service - Handles database operations with Notion API
 * 
 * @author Malay
 * @version 1.0.0-beta
 */

import { Client } from '@notionhq/client';
import { config } from '../config/index.js';

export class NotionService {
    constructor() {
        this.notion = new Client({
            auth: config.notion.token,
        });
        this.todoDbId = config.notion.databases.todo;
        this.jobsDbId = config.notion.databases.jobs;
    }

    /**
     * Check Notion connection
     */
    async checkConnection() {
        try {
            // Try to access the user info
            const user = await this.notion.users.me();
            
            // Check if databases are accessible
            const databases = [];
            
            if (this.todoDbId) {
                try {
                    await this.notion.databases.retrieve({ database_id: this.todoDbId });
                    databases.push('TODO');
                } catch (error) {
                    console.warn('TODO database not accessible:', error.message);
                }
            }
            
            if (this.jobsDbId) {
                try {
                    await this.notion.databases.retrieve({ database_id: this.jobsDbId });
                    databases.push('JOBS');
                } catch (error) {
                    console.warn('JOBS database not accessible:', error.message);
                }
            }

            return {
                success: true,
                data: {
                    user: user.name,
                    databases: databases.join(', ') || 'None'
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create a new task in Notion
     */
    async createTask(entities) {
        try {
            if (!this.todoDbId) {
                throw new Error('TODO database ID not configured');
            }

            const properties = {
                'Task': {
                    title: [
                        {
                            text: {
                                content: entities.title || 'Untitled Task'
                            }
                        }
                    ]
                }
            };

            // Add priority if specified
            if (entities.priority) {
                // Map priority values to match Notion options exactly
                const priorityMap = {
                    'low': 'Low',
                    'medium': 'Medium', 
                    'high': 'High',
                    'highest': 'Highest',
                    'lowest': 'Lowest'
                };
                
                const priorityValue = priorityMap[entities.priority.toLowerCase()] || 'Medium';
                
                properties['Priority'] = {
                    select: {
                        name: priorityValue
                    }
                };
            }

            // Add due date if specified - Now works since Due date is date type
            if (entities.dueDate) {
                const date = this.parseDueDate(entities.dueDate);
                if (date) {
                    properties['Due date'] = {
                        date: {
                            start: date
                        }
                    };
                }
            }

            // Add status (default to Not started) - Status is a status type
            properties['Status'] = {
                status: {
                    name: 'Not started'
                }
            };

            const response = await this.notion.pages.create({
                parent: {
                    database_id: this.todoDbId
                },
                properties: properties
            });

            return {
                success: true,
                data: {
                    id: response.id,
                    title: entities.title,
                    url: response.url
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create a new job application in Notion
     */
    async createJobApplication(entities) {
        try {
            if (!this.jobsDbId) {
                throw new Error('JOBS database ID not configured');
            }

            const properties = {
                'Company': {
                    title: [
                        {
                            text: {
                                content: entities.company || 'Unknown Company'
                            }
                        }
                    ]
                },
                'Position': {
                    rich_text: [
                        {
                            text: {
                                content: entities.title || entities.position || 'Unknown Position'
                            }
                        }
                    ]
                },
                'Status': {
                    select: {
                        name: 'Applied'
                    }
                },
                'Date Applied': {
                    date: {
                        start: new Date().toISOString().split('T')[0]
                    }
                }
            };

            // Add application link if provided
            if (entities.applicationLink) {
                properties['Application Link'] = {
                    url: entities.applicationLink
                };
            }

            // Add resume used if provided
            if (entities.resumeUsed) {
                properties['Resume Used'] = {
                    rich_text: [
                        {
                            text: {
                                content: entities.resumeUsed
                            }
                        }
                    ]
                };
            }

            // Add notes if provided
            if (entities.note || entities.notes) {
                properties['Notes'] = {
                    rich_text: [
                        {
                            text: {
                                content: entities.note || entities.notes
                            }
                        }
                    ]
                };
            }

            // Add next step if provided
            if (entities.nextStep) {
                properties['Next Step'] = {
                    rich_text: [
                        {
                            text: {
                                content: entities.nextStep
                            }
                        }
                    ]
                };
            }

            const response = await this.notion.pages.create({
                parent: {
                    database_id: this.jobsDbId
                },
                properties: properties
            });

            return {
                success: true,
                data: {
                    id: response.id,
                    company: entities.company,
                    position: entities.title || entities.position,
                    url: response.url
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Search tasks in Notion database
     */
    async searchTasks(query = {}) {
        try {
            if (!this.todoDbId) {
                throw new Error('TODO database ID not configured');
            }

            const filter = {};
            
            if (query.title) {
                filter.property = 'Task';
                filter.rich_text = {
                    contains: query.title
                };
            }

            const response = await this.notion.databases.query({
                database_id: this.todoDbId,
                filter: Object.keys(filter).length > 0 ? filter : undefined,
                page_size: 10
            });

            const tasks = response.results.map(page => ({
                id: page.id,
                title: page.properties.Task?.title?.[0]?.plain_text || 'Untitled',
                status: page.properties.Status?.status?.name || 'Unknown',
                priority: page.properties.Priority?.select?.name || 'Medium',
                dueDate: page.properties['Due date']?.date?.start || null,
                url: page.url
            }));

            return {
                success: true,
                data: tasks
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Search job applications in Notion database
     */
    async searchJobs(query = {}) {
        try {
            if (!this.jobsDbId) {
                throw new Error('JOBS database ID not configured');
            }

            const filter = {};
            
            if (query.title) {
                filter.property = 'Company';
                filter.rich_text = {
                    contains: query.title
                };
            }

            const response = await this.notion.databases.query({
                database_id: this.jobsDbId,
                filter: Object.keys(filter).length > 0 ? filter : undefined,
                page_size: 10
            });

            const jobs = response.results.map(page => ({
                id: page.id,
                title: page.properties.Position?.rich_text?.[0]?.plain_text || 'Untitled',
                company: page.properties.Company?.title?.[0]?.plain_text || 'Unknown',
                status: page.properties.Status?.select?.name || 'Unknown',
                url: page.url
            }));

            return {
                success: true,
                data: jobs
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get recent tasks
     */
    async getRecentTasks(limit = 5) {
        try {
            if (!this.todoDbId) {
                return { success: true, data: [] };
            }

            const response = await this.notion.databases.query({
                database_id: this.todoDbId,
                page_size: limit
            });

            const tasks = response.results.map(page => ({
                id: page.id,
                title: page.properties.Task?.title?.[0]?.plain_text || 'Untitled',
                status: page.properties.Status?.status?.name || 'Unknown',
                priority: page.properties.Priority?.select?.name || 'Medium',
                dueDate: page.properties['Due date']?.date?.start || null
            }));

            return {
                success: true,
                data: tasks
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get recent job applications
     */
    async getRecentJobs(limit = 5) {
        try {
            if (!this.jobsDbId) {
                return { success: true, data: [] };
            }

            const response = await this.notion.databases.query({
                database_id: this.jobsDbId,
                page_size: limit
            });

            const jobs = response.results.map(page => ({
                id: page.id,
                title: page.properties.Title?.title?.[0]?.plain_text || 'Untitled',
                company: page.properties.Company?.rich_text?.[0]?.plain_text || 'Unknown',
                status: page.properties.Status?.select?.name || 'Unknown',
                priority: page.properties.Priority?.select?.name || 'Medium'
            }));

            return {
                success: true,
                data: jobs
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Update task status
     */
    async updateTaskStatus(taskId, status) {
        try {
            // Map status values to match Notion options
            const statusMap = {
                'not started': 'Not started',
                'todo': 'Not started',
                'in progress': 'In progress',
                'complete': 'Done',
                'done': 'Done'
            };
            
            const statusValue = statusMap[status.toLowerCase()] || status;

            const response = await this.notion.pages.update({
                page_id: taskId,
                properties: {
                    'Status': {
                        status: {
                            name: statusValue
                        }
                    }
                }
            });

            return {
                success: true,
                data: {
                    id: response.id,
                    status: statusValue
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Update task details
     */
    async updateTask(taskId, updates) {
        try {
            const properties = {};

            // Update title if provided
            if (updates.title) {
                properties['Task'] = {
                    title: [
                        {
                            text: {
                                content: updates.title
                            }
                        }
                    ]
                };
            }

            // Update priority if provided
            if (updates.priority) {
                const priorityMap = {
                    'low': 'Low',
                    'medium': 'Medium', 
                    'high': 'High',
                    'highest': 'Highest',
                    'lowest': 'Lowest'
                };
                
                const priorityValue = priorityMap[updates.priority.toLowerCase()] || 'Medium';
                
                properties['Priority'] = {
                    select: {
                        name: priorityValue
                    }
                };
            }

            // Update due date if provided
            if (updates.dueDate) {
                const date = this.parseDueDate(updates.dueDate);
                if (date) {
                    properties['Due date'] = {
                        date: {
                            start: date
                        }
                    };
                }
            }

            // Update status if provided
            if (updates.status) {
                const statusMap = {
                    'not started': 'Not started',
                    'todo': 'Not started',
                    'in progress': 'In progress',
                    'complete': 'Done',
                    'done': 'Done'
                };
                
                const statusValue = statusMap[updates.status.toLowerCase()] || updates.status;
                
                properties['Status'] = {
                    status: {
                        name: statusValue
                    }
                };
            }

            const response = await this.notion.pages.update({
                page_id: taskId,
                properties: properties
            });

            return {
                success: true,
                data: {
                    id: response.id,
                    url: response.url
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Delete task
     */
    async deleteTask(taskId) {
        try {
            const response = await this.notion.pages.update({
                page_id: taskId,
                archived: true
            });

            return {
                success: true,
                data: {
                    id: response.id,
                    archived: true
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Mark task as complete
     */
    async completeTask(taskId) {
        return this.updateTaskStatus(taskId, 'Done');
    }

    /**
     * Get tasks by status
     */
    async getTasksByStatus(status, limit = 10) {
        try {
            if (!this.todoDbId) {
                return { success: true, data: [] };
            }

            const statusMap = {
                'not started': 'Not started',
                'todo': 'Not started',
                'in progress': 'In progress',
                'complete': 'Done',
                'done': 'Done'
            };
            
            const statusValue = statusMap[status.toLowerCase()] || status;

            const response = await this.notion.databases.query({
                database_id: this.todoDbId,
                filter: {
                    property: 'Status',
                    status: {
                        equals: statusValue
                    }
                },
                page_size: limit
            });

            const tasks = response.results.map(page => ({
                id: page.id,
                title: page.properties.Task?.title?.[0]?.plain_text || 'Untitled',
                status: page.properties.Status?.status?.name || 'Unknown',
                priority: page.properties.Priority?.select?.name || 'Medium',
                dueDate: page.properties['Due date']?.date?.start || null,
                url: page.url
            }));

            return {
                success: true,
                data: tasks
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get tasks by priority
     */
    async getTasksByPriority(priority, limit = 10) {
        try {
            if (!this.todoDbId) {
                return { success: true, data: [] };
            }

            const priorityMap = {
                'low': 'Low',
                'medium': 'Medium', 
                'high': 'High',
                'highest': 'Highest',
                'lowest': 'Lowest'
            };
            
            const priorityValue = priorityMap[priority.toLowerCase()] || priority;

            const response = await this.notion.databases.query({
                database_id: this.todoDbId,
                filter: {
                    property: 'Priority',
                    select: {
                        equals: priorityValue
                    }
                },
                page_size: limit
            });

            const tasks = response.results.map(page => ({
                id: page.id,
                title: page.properties.Task?.title?.[0]?.plain_text || 'Untitled',
                status: page.properties.Status?.status?.name || 'Unknown',
                priority: page.properties.Priority?.select?.name || 'Medium',
                dueDate: page.properties['Due date']?.date?.start || null,
                url: page.url
            }));

            return {
                success: true,
                data: tasks
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Parse due date string to ISO format
     */
    parseDueDate(dueDate) {
        const today = new Date();
        
        switch (dueDate?.toLowerCase()) {
            case 'today':
                return today.toISOString().split('T')[0];
            case 'tomorrow':
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);
                return tomorrow.toISOString().split('T')[0];
            case 'next_week':
            case 'next week':
                const nextWeek = new Date(today);
                nextWeek.setDate(today.getDate() + 7);
                return nextWeek.toISOString().split('T')[0];
            default:
                return null;
        }
    }
}

// Create and export service instance
const notionService = new NotionService();
export { notionService };
