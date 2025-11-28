import os
import uvicorn
from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from typing import List, Optional
import json
import re
import sqlite3
import datetime
import PyPDF2
import io

# ----------------------
#  Gemini Configuration
# ----------------------
API_KEY = "AIzaSyC0V9L8kdZdzbKPxbCi1XnZ9a390jsgHjA"
genai.configure(api_key=API_KEY)

model = genai.GenerativeModel("gemini-2.0-flash")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------
# SQLite Setup
# ----------------------
DATABASE_NAME = "studyflow.db"

def get_db_connection():
    conn = sqlite3.connect(DATABASE_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def setup_database():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            type TEXT NOT NULL,
            input_text TEXT NOT NULL,
            output_content TEXT NOT NULL
        );
    """)
    conn.commit()
    conn.close()

setup_database()

# ----------------------
#   Models
# ----------------------
class NoteRequest(BaseModel):
    text: str

class Flashcard(BaseModel):
    front: str
    back: str

class TimetableItem(BaseModel):
    time: str
    activity: str

class APIResponse(BaseModel):
    summary: Optional[str] = None
    flashcards: Optional[List[Flashcard]] = None
    timetable: Optional[List[TimetableItem]] = None

class HistoryItem(BaseModel):
    id: int
    timestamp: str
    type: str
    input_text: str
    output_content: str

# ----------------------
# PDF Extraction Helper
# ----------------------
def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF bytes"""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        raise Exception(f"Failed to extract text from PDF: {str(e)}")

# ----------------------
# Helpers
# ----------------------
def safe_extract(res):
    try:
        return res.text
    except:
        try:
            return res.candidates[0].content.parts[0].text
        except:
            return None

def save_history(type: str, input_text: str, output_content: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    timestamp = datetime.datetime.now().isoformat()
    cursor.execute(
        "INSERT INTO history (timestamp, type, input_text, output_content) VALUES (?, ?, ?, ?)",
        (timestamp, type, input_text, output_content)
    )
    conn.commit()
    conn.close()

# ----------------------
# SUMMARY
# ----------------------
@app.post("/generate/summary", response_model=APIResponse)
async def generate_summary(
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    try:
        # Determine input source
        if file:
            file_bytes = await file.read()
            input_text = extract_text_from_pdf(file_bytes)
            save_input = f"PDF: {file.filename}"
        elif text:
            input_text = text
            save_input = text
        else:
            raise HTTPException(400, "Either text or file must be provided")

        # Generate summary
        res = model.generate_content(
            f"Summarize clearly in clean text:\n\n{input_text}"
        )
        summary = safe_extract(res)
        if not summary:
            raise Exception("Empty summary from model.")
        
        save_history("summary", save_input, summary)
        return {"summary": summary}

    except Exception as e:
        raise HTTPException(500, f"Summary error: {str(e)}")


# ----------------------
# FLASHCARDS
# ----------------------
@app.post("/generate/flashcards", response_model=APIResponse)
async def generate_flashcards(
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    try:
        # Determine input source
        if file:
            file_bytes = await file.read()
            input_text = extract_text_from_pdf(file_bytes)
            save_input = f"PDF: {file.filename}"
        elif text:
            input_text = text
            save_input = text
        else:
            raise HTTPException(400, "Either text or file must be provided")

        prompt = (
            "Create exactly 5 flashcards in STRICT JSON array format.\n"
            "Do not add explanations. Only return JSON.\n"
            "Keys: front, back.\n\n"
            f"{input_text}"
        )

        res = model.generate_content(prompt)
        raw = safe_extract(res)

        # Extract JSON array
        json_match = re.search(r"\[.*\]", raw, re.DOTALL)
        if not json_match:
            raise Exception("No JSON array found.")

        clean_json = json_match.group(0)
        data = json.loads(clean_json)
        
        save_history("flashcards", save_input, clean_json)
        return {"flashcards": data}

    except Exception as e:
        raise HTTPException(500, f"Flashcard error: {str(e)}")


# ----------------------
# TIMETABLE
# ----------------------
@app.post("/generate/timetable", response_model=APIResponse)
async def generate_timetable(
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    try:
        # Determine input source
        if file:
            file_bytes = await file.read()
            input_text = extract_text_from_pdf(file_bytes)
            save_input = f"PDF: {file.filename}"
        elif text:
            input_text = text
            save_input = text
        else:
            raise HTTPException(400, "Either text or file must be provided")

        prompt = (
            "Create a 1-day study timetable in STRICT JSON array format.\n"
            "Keys: time, activity.\n\n"
            f"{input_text}"
        )

        res = model.generate_content(prompt)
        raw = safe_extract(res)

        json_match = re.search(r"\[.*\]", raw, re.DOTALL)
        if not json_match:
            raise Exception("No JSON found.")

        clean_json = json_match.group(0)
        data = json.loads(clean_json)
        
        save_history("timetable", save_input, clean_json)
        return {"timetable": data}

    except Exception as e:
        raise HTTPException(500, f"Timetable error: {str(e)}")

# ----------------------
# HISTORY API
# ----------------------
@app.get("/history", response_model=List[HistoryItem])
async def get_history():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM history ORDER BY id DESC LIMIT 20")
    history_rows = cursor.fetchall()
    conn.close()
    
    history_list = [dict(row) for row in history_rows]
    return history_list

# ----------------------
# RUN
# ----------------------
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)