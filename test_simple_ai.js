/**
 * Simple AI Test - Check if CodeLlama is interpreting commands correctly
 */

import('./src/services/backend.js').then(async ({ BackendService }) => {
    console.log('🧪 Simple AI Interpretation Test...\n');

    const backendService = new BackendService();

    try {
        // Test 1: Check backend connection
        console.log('📡 Testing backend connection...');
        const status = await backendService.getStatus();
        if (status.available) {
            console.log(`✅ Backend connected: ${status.aiModel} (${status.modelStatus})`);
        } else {
            console.log('❌ Backend not available');
            return;
        }

        // Test 2: Simple commands
        console.log('\n🤖 Testing simple commands...');
        
        const testCommands = [
            "Show me all my tasks",
            "List my high priority tasks",
            "Create a task to call John"
        ];

        for (const command of testCommands) {
            console.log(`\n💬 Command: "${command}"`);
            
            try {
                const interpretation = await backendService.interpretCommand(command);
                if (interpretation.success) {
                    const { action, entities, confidence } = interpretation.data;
                    console.log(`✅ AI Response:`);
                    console.log(`   Action: ${action}`);
                    console.log(`   Title: "${entities.title || '(empty)'}"`);
                    console.log(`   Priority: ${entities.priority || '(empty)'}`);
                    console.log(`   Status: ${entities.status || '(empty)'}`);
                    console.log(`   Confidence: ${confidence}`);
                    
                    // Check if the action matches the expected intent
                    if (command.includes("Show me all my tasks") && action !== "listTasks") {
                        console.log(`❌ WRONG ACTION: Expected "listTasks" but got "${action}"`);
                    } else if (command.includes("List my high priority") && action !== "getTasksByPriority") {
                        console.log(`❌ WRONG ACTION: Expected "getTasksByPriority" but got "${action}"`);
                    } else if (command.includes("Create a task") && action !== "addTask") {
                        console.log(`❌ WRONG ACTION: Expected "addTask" but got "${action}"`);
                    } else {
                        console.log(`✅ Correct action identified!`);
                    }
                } else {
                    console.log(`❌ Interpretation failed: ${interpretation.error}`);
                }
            } catch (error) {
                console.log(`❌ Error: ${error.message}`);
            }
        }

        console.log('\n🎉 Simple AI test completed!');

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
});
