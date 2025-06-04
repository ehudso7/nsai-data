/**
 * Basic Research Example
 * Demonstrates how to use NSAI Data for simple research queries
 */

import { NSAIClient } from 'nsai-sdk';

// Initialize the client
const client = new NSAIClient(process.env.NSAI_API_KEY);

async function main() {
    try {
        // Create a research query
        console.log('🔍 Starting research on AI ethics...');
        
        const response = await client.research(
            'What are the main ethical considerations in AI development?',
            {
                maxSources: 15,
                outputFormat: 'markdown',
                enableValidation: true
            }
        );
        
        // Display results
        console.log(`\n✅ Research completed in ${response.durationMs}ms`);
        console.log(`📊 Analyzed ${response.sources?.length || 0} sources`);
        
        if (response.metadata?.validation?.confidence_score) {
            console.log(`🎯 Confidence score: ${response.metadata.validation.confidence_score}%`);
        }
        
        console.log('\n📄 Report:');
        console.log('-'.repeat(80));
        console.log(response.report);
        console.log('-'.repeat(80));
        
        // Save report to file
        const fs = require('fs').promises;
        await fs.writeFile('ai_ethics_research.md', response.report);
        console.log('\n💾 Report saved to ai_ethics_research.md');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main();