from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from groq import Groq
import os
import json
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Configure Groq AI
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

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
        You are a senior logistics risk analyst for RouteIQLogistics AI. 
        Analyze the risk for shipment {request.shipment.get('id')} from {request.shipment.get('origin')} to {request.shipment.get('destination')}.
        
        WAYPOINTS/ROUTE: 
        {request.shipment.get('waypoints', 'Direct route')}
        
        RELEVANT LOGISTICS NEWS:
        {news_summaries}
        
        CURRENT WEATHER AT SHIPMENT LOCATION:
        - Condition: {weather_description}
        - Temp: {temp:.1f}Â°C
        
        TASK:
        1. Identify if this shipment is at risk based on the news and weather.
        2. Correlate events with specific checkpoints or route segments.
        3. Predict delay probability and estimated time impact.
        4. Recommend a proactive mitigation strategy.
        
        Return ONLY a JSON object with:
        {{
            "shipmentId": "{request.shipment.get('id')}",
            "riskScore": (integer 0-100),
            "riskReason": (string explanation),
            "confidence": ("LOW" | "MEDIUM" | "HIGH"),
            "delayProbability": ("LOW" | "MEDIUM" | "HIGH"),
            "estimatedDelayRange": (string e.g. "6-12 hours"),
            "affectedCheckpoint": (string e.g. "Suez Canal" or "Munich Hub"),
            "recommendedAction": (string concise recommendation),
            "mitigationStrategy": (detailed proactive advice)
        }}
        """

        response = client.chat.completions.create(
            messages=[{"role": "user", "content": system_prompt}],
            model=GROQ_MODEL,
            response_format={"type": "json_object"}
        )
        
        # Extract response text
        content = response.choices[0].message.content
        analysis = json.loads(content)
        
        return analysis

    except Exception as e:
        print(f"Error in Groq Analysis: {str(e)}")
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
        "service": "RouteIQ AI Disruption Engine",
        "model": f"Groq ({GROQ_MODEL})",
        "status": "Ready"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

