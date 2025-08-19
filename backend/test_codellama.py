#!/usr/bin/env python3
"""
Test CodeLlama integration
"""

import requests

def test_codellama():
    """Test CodeLlama with a few commands"""
    
    commands = [
        "Add urgent meeting with client tomorrow",
        "Schedule low priority task to buy groceries this weekend", 
        "Create work task to finish presentation next week",
        "Search for dentist appointment tasks"
    ]
    
    print("Testing CodeLlama 7B Instruct Integration")
    print("=" * 50)
    
    for i, command in enumerate(commands, 1):
        print(f"\n[Test {i}] Command: '{command}'")
        
        try:
            response = requests.post(
                "http://localhost:8000/interpret",
                json={"command": command},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                if result["success"]:
                    data = result["data"]
                    print(f"Action: {data['action']}")
                    print(f"Title: {data['entities'].get('title', 'N/A')}")
                    print(f"Due Date: {data['entities'].get('dueDate', 'N/A')}")
                    print(f"Priority: {data['entities'].get('priority', 'N/A')}")
                    print(f"Category: {data['entities'].get('category', 'N/A')}")
                    print(f"Method: {data['ai_analysis']['method']}")
                else:
                    print(f"Failed: {result.get('error', 'Unknown error')}")
            else:
                print(f"HTTP Error: {response.status_code}")
                
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    test_codellama()
