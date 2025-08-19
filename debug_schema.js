/**
 * Debug script to check the actual property names in your Notion databases
 */

import { config } from './src/config/index.js';
import { Client } from '@notionhq/client';

const notion = new Client({
    auth: config.notion.token,
});

async function debugSchema() {
    try {
        console.log('=== TODO Database Schema ===');
        const todoDb = await notion.databases.retrieve({ 
            database_id: config.notion.databases.todo 
        });
        
        console.log('Properties:');
        Object.keys(todoDb.properties).forEach(key => {
            const prop = todoDb.properties[key];
            console.log(`- "${key}" (type: ${prop.type})`);
        });

        console.log('\n=== JOBS Database Schema ===');
        const jobsDb = await notion.databases.retrieve({ 
            database_id: config.notion.databases.jobs 
        });
        
        console.log('Properties:');
        Object.keys(jobsDb.properties).forEach(key => {
            const prop = jobsDb.properties[key];
            console.log(`- "${key}" (type: ${prop.type})`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

debugSchema();
