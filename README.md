# StudyFlow AI Platform

StudyFlow is an AI-powered educational assistant designed to help students and learners optimize their study process. The platform allows users to upload notes or PDF files, automatically generates summaries and flashcards, and creates smart study timetables tailored to individual needs.

## Features

* **Upload Notes & PDFs**: Users can upload text files or PDFs.
* **AI-Generated Summaries**: The system automatically generates concise summaries from uploaded content using Google Gemini.
* **Flashcards Generation**: Key points are converted into interactive flashcards for easier learning and revision.
* **Smart Timetable Generator**: Generates optimized study schedules based on the user's uploaded content and study goals.

## Technology Stack

* **Frontend**: React (TypeScript)
* **Backend**: FastAPI (Python)
* **Database**: SQLite
* **AI Integration**: Google Gemini API
* **File Handling**: Supports text and PDF uploads

## Installation

### Backend

1. Clone the repository:

```bash
git clone <https://github.com/ompandey07/StudyFlowl>
cd backend
```

2. Create a virtual environment and activate it:

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate  # Windows
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Start the FastAPI server:

```bash
uvicorn main:app --reload
```

### Frontend

1. Navigate to the frontend folder:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

## Usage

1. Open the frontend URL in your browser (usually `http://localhost:5173`).
2. Upload your notes or PDF files.
3. View automatically generated summaries and flashcards.
4. Use the smart timetable generator to plan your study schedule.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for bug fixes and feature requests.

## License

This project is licensed under the MIT License.
