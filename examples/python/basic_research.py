"""
Basic Research Example
Demonstrates how to use NSAI Data for simple research queries
"""

from nsai import NSAIClient
import os

# Initialize the client
# You can pass the API key directly or set NSAI_API_KEY environment variable
client = NSAIClient(api_key=os.getenv("NSAI_API_KEY"))

def main():
    # Create a research query
    print("🔍 Starting research on quantum computing...")
    
    response = client.research(
        query="What are the latest breakthroughs in quantum computing in 2024?",
        max_sources=15,
        output_format="markdown"
    )
    
    # Display results
    print(f"\n✅ Research completed in {response.duration_ms}ms")
    print(f"📊 Analyzed {len(response.sources)} sources")
    
    if response.confidence_score:
        print(f"🎯 Confidence score: {response.confidence_score}%")
    
    print("\n📄 Report:")
    print("-" * 80)
    print(response.report)
    print("-" * 80)
    
    # Save report to file
    with open("quantum_computing_research.md", "w") as f:
        f.write(response.report)
    print("\n💾 Report saved to quantum_computing_research.md")

if __name__ == "__main__":
    main()