Weather Assistant - Complete Setup Guide
1. Download ZIP 
Visit: https://github.com/sawantmahima19-lang/weather-assistant
Click "Code" → "Download ZIP"
Extract ZIP file to your computer

2. Prerequisites
Python 3.8+: https://python.org
Node.js 16+: https://nodejs.org

3. Get API Keys (FREE, 2 minutes)
WeatherAPI: Sign up at https://www.weatherapi.com → Get free API key
OpenRouter: Sign up at https://openrouter.ai → Get free API key

4. Run Backend
bash
cd backend
# Create virtual environment
python -m venv venv
# Activate (Windows):
venv\Scripts\activate
# Activate (Mac/Linux):
source venv/bin/activate
# Install dependencies
pip install -r requirements.txt
# Create .env file with your API keys
echo WEATHER_API_KEY=your_key_here > .env
echo OPENROUTER_API_KEY=your_key_here >> .env
# Start server
python main.py
✅ Backend running on: http://localhost:8001

5. Run Frontend
bash
# Open NEW terminal
cd frontend

# Install dependencies
npm install

# Start application
npm start
✅ Application opens: http://localhost:3000

6. Test the Application
Open browser to: http://localhost:3000
Ask: "What's the weather in Tokyo?"
Press Send
