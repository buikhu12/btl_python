import os
import google.generativeai as genai

genai.configure(api_key=os.getenv("GEMINI_API_KEY", "dummy_key"))
model = genai.GenerativeModel('gemini-1.5-flash')

def get_gemini_response(prompt: str) -> str:
    response = model.generate_content(prompt)
    return response.text