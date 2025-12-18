from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain.agents import initialize_agent, AgentType
from langchain.tools import Tool
from langchain_openai import ChatOpenAI
import requests
import os
import re
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class Message(BaseModel):
    text: str

class Response(BaseModel):
    response: str

# REAL WEATHER FUNCTION FOR ANY CITY
def get_real_weather(city_name: str) -> str:
    """
    Get real-time weather for ANY city using WeatherAPI
    Returns: Formatted weather string
    """
    api_key = os.getenv("WEATHER_API_KEY")
    if not api_key or api_key == "your_weatherapi_key_here":
        return "⚠️ Please add your WeatherAPI key to .env file"
    
    try:
        # Call real weather API
        url = f"http://api.weatherapi.com/v1/current.json?key={api_key}&q={city_name}&aqi=no"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            # Extract weather data
            location = data['location']['name']
            country = data['location']['country']
            temp_c = data['current']['temp_c']
            condition = data['current']['condition']['text']
            humidity = data['current']['humidity']
            wind_kph = data['current']['wind_kph']
            
            return f"""Current weather in {location}, {country}:
• Temperature: {temp_c}°C ({temp_c*9/5+32}°F)
• Condition: {condition}
• Humidity: {humidity}%
• Wind Speed: {wind_kph} km/h
• Feels like: {data['current']['feelslike_c']}°C"""
        
        elif response.status_code == 400:
            return f"City '{city_name}' not found. Please check the spelling."
        else:
            return f"Weather service error: {response.status_code}"
            
    except requests.exceptions.Timeout:
        return "Weather service timeout. Please try again."
    except Exception as e:
        return f"Error fetching weather: {str(e)[:80]}"

# DIRECT WEATHER FUNCTION (FALLBACK WHEN LANGCHAIN FAILS)
def get_weather_for_query(query: str) -> str:
    """Extract city from query and get weather - WORKS FOR ANY CITY"""
    # Common patterns people use
    patterns = [
        r'weather (?:in|of|at|for) ([^?.!]+)',
        r'temperature (?:in|of|at) ([^?.!]+)',
        r'how.*weather.*in ([^?.!]+)',
        r'what.*weather.*in ([^?.!]+)',
        r'weather.*like.*in ([^?.!]+)',
    ]
    
    query_lower = query.lower().strip()
    
    # Try to extract city using patterns
    for pattern in patterns:
        match = re.search(pattern, query_lower)
        if match:
            city = match.group(1).strip()
            # Clean up the city name
            city = re.sub(r'\?|please|tell me|can you|the', '', city).strip()
            if city:
                return get_real_weather(city)
    
    # If no pattern match, assume last word(s) are the city
    words = query_lower.split()
    # Remove common question words
    stop_words = ['what', 'is', 'the', 'weather', 'in', 'of', 'at', 'how', 
                  'today', '?', 'please', 'tell', 'me', 'current', 'now']
    city_words = [w for w in words if w not in stop_words]
    
    if city_words:
        city = ' '.join(city_words[-2:] if len(city_words) > 1 else city_words)
        return get_real_weather(city)
    
    return "Please specify a city. Example: 'What's the weather in Tokyo?' or 'Weather in Paris'"

# Initialize LangChain Agent with REAL weather tool
def create_weather_agent():
    """Create LangChain agent with real weather tool"""
    
    # Create the weather tool
    weather_tool = Tool(
        name="GetCurrentWeather",
        func=get_real_weather,
        description="""Get current weather for any city worldwide.
        Input should be a city name (e.g., 'London', 'Tokyo', 'New York').
        Returns detailed weather information."""
    )
    
    # FIXED: Correct LLM initialization
    llm = ChatOpenAI(
        model="gpt-3.5-turbo",  # CORRECT: Use simple model name
        api_key=os.getenv("OPENROUTER_API_KEY"),
        base_url=os.getenv("OPENROUTER_BASE_URL"),
        temperature=0.3,
        max_tokens=500
    )
    
    # Create agent with the tool
    agent = initialize_agent(
        tools=[weather_tool],
        llm=llm,
        agent=AgentType.OPENAI_FUNCTIONS,  # Use this agent type
        verbose=True,
        max_iterations=2,
        handle_parsing_errors=True
    )
    
    return agent

# Create agent instance
try:
    print("🔄 Initializing LangChain agent with real weather API...")
    weather_agent = create_weather_agent()
    print("✅ LangChain agent initialized successfully!")
except Exception as e:
    print(f"❌ Agent initialization failed: {e}")
    # Fallback to direct function
    weather_agent = None

@app.get("/")
def read_root():
    return {"message": "Weather API with LangChain is running"}

@app.post("/chat", response_model=Response)
async def chat(message: Message):
    try:
        if not weather_agent:
            # FIXED: Use the new get_weather_for_query function that works for ANY city
            response = get_weather_for_query(message.text)
            return Response(response=response)
        
        # Use LangChain agent
        response = weather_agent.run(message.text)
        return Response(response=response)
        
    except Exception as e:
        error_msg = str(e)
        # If LangChain fails, fallback to direct query
        if "not found" in error_msg.lower() or "400" in error_msg or "city" in error_msg.lower():
            # Try direct approach
            response = get_weather_for_query(message.text)
            return Response(response=response)
        return Response(response=f"Error: {error_msg[:100]}")

@app.get("/test/{city}")
def test_weather_api(city: str = "London"):
    """Test endpoint to verify weather API is working"""
    return {"city": city, "weather": get_real_weather(city)}

if __name__ == "__main__":
    import uvicorn
    print("\n" + "="*50)
    print("🌍 REAL WEATHER ASSISTANT BACKEND")
    print("="*50)
    print(f"OpenRouter API: {'✅ Configured' if os.getenv('OPENROUTER_API_KEY') and os.getenv('OPENROUTER_API_KEY') != 'your_key_goes_here' else '❌ Missing'}")
    print(f"WeatherAPI: {'✅ Configured' if os.getenv('WEATHER_API_KEY') and os.getenv('WEATHER_API_KEY') != 'your_weatherapi_key_here' else '❌ Missing'}")
    print(f"Server: http://localhost:8001")
    print("="*50)
    print("Features:")
    print("• LangChain agent with weather tool")
    print("• Real weather for ANY city worldwide")
    print("• Fallback system if LangChain fails")
    print("="*50)
    print("Test endpoints:")
    print("1. /test/London  - Test London weather")
    print("2. /test/Tokyo   - Test Tokyo weather")
    print("3. /test/Paris   - Test Paris weather")
    print("4. /test/Dubai   - Test Dubai weather")
    print("="*50 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8001)