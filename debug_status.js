/**
 * Debug script to check status options in TODO database
 */

import { config } from './src/config/index.js';
import { Client } from '@notionhq/client';

const notion = new Client({
    auth: config.notion.token,
});

async function checkStatusOptions() {
    try {
        console.log('=== TODO Database Status Options ===');
        const todoDb = await notion.databases.retrieve({ 
            database_id: config.notion.databases.todo 
        });
        
        const statusProperty = todoDb.properties['Status'];
        if (statusProperty && statusProperty.type === 'status') {
            console.log('Available status options:');
            if (statusProperty.status && statusProperty.status.options) {
                statusProperty.status.options.forEach((option, index) => {
                    console.log(`${index + 1}. "${option.name}" (id: ${option.id})`);
                });
            } else {
                console.log('No status options found in the property definition');
            }
        }

        // Also get a sample task to see current status values
        console.log('\n=== Sample Tasks ===');
        const sampleTasks = await notion.databases.query({
            database_id: config.notion.databases.todo,
            page_size: 3
        });

        sampleTasks.results.forEach((task, index) => {
            const title = task.properties.Task?.title?.[0]?.plain_text || 'Untitled';
            const status = task.properties.Status?.status?.name || 'No status';
            console.log(`${index + 1}. "${title}" - Status: "${status}"`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkStatusOptions();
