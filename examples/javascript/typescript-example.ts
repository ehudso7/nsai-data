/**
 * TypeScript Example
 * Demonstrates type-safe usage of NSAI Data SDK
 */

import { NSAIClient, ResearchResponse, ResearchQuery } from 'nsai-sdk';

class ResearchService {
    private client: NSAIClient;
    
    constructor(apiKey: string) {
        this.client = new NSAIClient(apiKey);
    }
    
    /**
     * Perform market research on a company or industry
     */
    async performMarketResearch(
        company: string,
        options?: {
            includCompetitors?: boolean;
            timeframe?: string;
        }
    ): Promise<ResearchResponse> {
        const query = `Market analysis for ${company}${
            options?.includCompetitors ? ' including main competitors' : ''
        }${
            options?.timeframe ? ` for ${options.timeframe}` : ''
        }`;
        
        return await this.client.research(query, {
            maxSources: 25,
            outputFormat: 'json',
            enableValidation: true
        });
    }
    
    /**
     * Compare multiple technologies or solutions
     */
    async compareTechnologies(
        technologies: string[]
    ): Promise<ResearchResponse> {
        const query = `Compare ${technologies.join(', ')} - pros, cons, use cases, and recommendations`;
        
        return await this.client.research(query, {
            maxSources: 30,
            outputFormat: 'markdown'
        });
    }
    
    /**
     * Wait for a research query to complete with progress updates
     */
    async researchWithProgress(
        query: string,
        onProgress?: (progress: number) => void
    ): Promise<ResearchResponse> {
        // Start the research
        const initialResponse = await this.client.research(query);
        
        // If already complete, return immediately
        if (initialResponse.status === 'completed') {
            return initialResponse;
        }
        
        // Wait for completion with progress updates
        return await this.client.waitForCompletion(
            initialResponse.researchId,
            {
                pollingInterval: 1000,
                timeout: 300000 // 5 minutes
            }
        );
    }
}

// Usage example
async function main() {
    const service = new ResearchService(process.env.NSAI_API_KEY!);
    
    try {
        // Example 1: Market research
        console.log('📈 Performing market research...');
        const marketResearch = await service.performMarketResearch('Tesla', {
            includCompetitors: true,
            timeframe: '2024'
        });
        
        console.log('Market Research Results:', marketResearch.report);
        
        // Example 2: Technology comparison
        console.log('\n🔬 Comparing technologies...');
        const techComparison = await service.compareTechnologies([
            'React', 'Vue.js', 'Angular'
        ]);
        
        console.log('Technology Comparison:', techComparison.report);
        
        // Example 3: Research with progress tracking
        console.log('\n🔄 Research with progress tracking...');
        const progressResearch = await service.researchWithProgress(
            'Future of blockchain in supply chain management',
            (progress) => {
                console.log(`Progress: ${progress}%`);
            }
        );
        
        console.log('Research complete!', progressResearch);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run if this is the main module
if (require.main === module) {
    main();
}