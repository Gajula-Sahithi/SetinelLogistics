from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
import os
import json
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash') # Using 1.5 flash as 2.5 isn't GA yet

class Shipment(BaseModel):
    id: str
    origin: str
    destination: str
    status: str
    carrier: str

class RiskAnalysisRequest(BaseModel):
    shipment: dict
    newsFeed: List[dict]
    weather: dict

@app.post("/analyze-risk")
async def analyze_risk(request: RiskAnalysisRequest):
    try:
        # Prompt construction
        news_summaries = "\n".join([f"- {n.get('title')}: {n.get('description')}" for n in request.newsFeed[:5]])
        weather_description = request.weather.get('weather', [{}])[0].get('description')
        temp = request.weather.get('main', {}).get('temp', 0) - 273.15 # Celsius
        
        system_prompt = f"""
        You are a senior logistics risk analyst for SentinelLogistics AI. 
        Analyze the risk for shipment {request.shipment.get('id')} from {request.shipment.get('origin')} to {request.shipment.get('destination')}.
        
        RELEVANT LOGISTICS NEWS:
        {news_summaries}
        
        CURRENT WEATHER AT SHIPMENT LOCATION:
        - Condition: {weather_description}
        - Temp: {temp:.1f}°C
        
        TASK:
        Identify if this shipment is at risk based on the news (strikes, port closures, global logistics events) and weather.
        
        Return ONLY a JSON object with:
        {{
            "shipmentId": "{request.shipment.get('id')}",
            "riskScore": (integer 0-100),
            "riskReason": (string explanation in one sentence),
            "confidence": ("LOW" | "MEDIUM" | "HIGH"),
            "recommendedAction": (string concise recommendation)
        }}
        """

        response = model.generate_content(system_prompt)
        
        # Clean response if it contains markdown markers
        cleaned_response = response.text.replace('```json', '').replace('```', '').strip()
        analysis = json.loads(cleaned_response)
        
        return analysis

    except Exception as e:
        print(f"Error in Gemini Analysis: {str(e)}")
        # Fallback response
        return {
            "shipmentId": request.shipment.get('id', 'UNKNOWN'),
            "riskScore": 50,
            "riskReason": "Analysis failed, using baseline risk assessment.",
            "confidence": "LOW",
            "recommendedAction": "Manual review required"
        }

@app.get("/")
def read_root():
    return {
        "service": "Sentinel AI Disruption Engine",
        "model": "Gemini 1.5 Flash",
        "status": "Ready"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
