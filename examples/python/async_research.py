"""
Async Research Example
Demonstrates asynchronous research queries with webhook notifications
"""

from nsai import NSAIClient
import os
import time

client = NSAIClient(api_key=os.getenv("NSAI_API_KEY"))

def main():
    # Start multiple research queries asynchronously
    queries = [
        "Latest developments in renewable energy technology",
        "Impact of AI on healthcare diagnostics",
        "Future of electric vehicle batteries"
    ]
    
    research_ids = []
    
    print("🚀 Starting multiple research queries...\n")
    
    for query in queries:
        response = client.research(
            query=query,
            max_sources=10,
            webhook_url="https://your-webhook-endpoint.com/nsai-webhook"  # Optional
        )
        research_ids.append(response.research_id)
        print(f"📋 Started research: {query}")
        print(f"   ID: {response.research_id}")
    
    print("\n⏳ Monitoring research progress...\n")
    
    # Poll for completion
    completed = set()
    while len(completed) < len(research_ids):
        for research_id in research_ids:
            if research_id in completed:
                continue
                
            status = client.get_research_status(research_id)
            
            if status.status == "completed":
                completed.add(research_id)
                print(f"✅ Research {research_id} completed!")
                
                # Fetch full results
                history = client.get_research_history(limit=1)
                for query in history["queries"]:
                    if query["research_id"] == research_id:
                        print(f"   Topic: {queries[research_ids.index(research_id)]}")
                        print(f"   Duration: {query['duration_ms']}ms")
                        break
                        
            elif status.status == "failed":
                completed.add(research_id)
                print(f"❌ Research {research_id} failed")
            else:
                print(f"🔄 Research {research_id}: {status.status} - {status.progress}%")
        
        if len(completed) < len(research_ids):
            time.sleep(2)  # Wait before next check
    
    print("\n🎉 All research queries completed!")

if __name__ == "__main__":
    main()