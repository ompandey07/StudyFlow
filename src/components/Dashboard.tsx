import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  FileText, 
  Layers3, 
  Sparkles, 
  CalendarCheck, 
  Loader2, 
  ChevronRight,
  BookOpenText,
  Zap,
  Clock,
  Send,
  Plus,
  MessageSquare,
  History,
  Upload,
  X,
  File,
} from 'lucide-react';

// Define types for our data
interface Flashcard {
  front: string;
  back: string;
}

interface TimetableItem {
  time: string;
  activity: string;
}

interface HistoryItem {
  id: number;
  timestamp: string;
  type: 'summary' | 'flashcards' | 'timetable';
  input_text: string;
  output_content: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  type?: 'summary' | 'flashcards' | 'timetable';
  data?: any;
  fileName?: string;
}

const API_URL = 'http://localhost:8000';
const ACCENT_COLOR = 'indigo';

function Dashboard() {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch History on Load
  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/history`);
      setHistory(response.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Start new conversation
  const startNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setNotes('');
    setUploadedFile(null);
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setUploadedFile(file);
      } else {
        alert('Please upload a PDF file only.');
      }
    }
  };

  // Remove uploaded file
  const removeUploadedFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Generate content
  const handleGenerate = async (type: 'summary' | 'flashcards' | 'timetable') => {
    if (!notes.trim() && !uploadedFile) {
      return alert('Please enter some notes or upload a PDF first!');
    }
    
    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: uploadedFile ? `Uploaded PDF: ${uploadedFile.name}` : notes,
      fileName: uploadedFile?.name,
    };
    setMessages(prev => [...prev, userMessage]);
    
    setLoading(true);
    const currentNotes = notes;
    const currentFile = uploadedFile;
    setNotes('');
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); 
      
      const endpoint = `/generate/${type}`;
      let response;

      if (currentFile) {
        // Send PDF file
        const formData = new FormData();
        formData.append('file', currentFile);
        response = await axios.post(`${API_URL}${endpoint}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Send text
        response = await axios.post(`${API_URL}${endpoint}`, { text: currentNotes });
      }
      
      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: '',
        type: type,
        data: response.data,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      fetchHistory();
      
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Error generating content. Please check your backend connection.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Load history conversation
  const handleLoadHistory = (item: HistoryItem) => {
    setCurrentConversationId(item.id);
    
    const userMsg: Message = {
      role: 'user',
      content: item.input_text,
    };
    
    let assistantMsg: Message = {
      role: 'assistant',
      content: '',
      type: item.type,
      data: {},
    };
    
    try {
      if (item.type === 'summary') {
        assistantMsg.data = { summary: item.output_content };
      } else {
        const content = JSON.parse(item.output_content);
        if (item.type === 'flashcards') {
          assistantMsg.data = { flashcards: content };
        } else if (item.type === 'timetable') {
          assistantMsg.data = { timetable: content };
        }
      }
    } catch (e) {
      console.error("Error parsing history content:", e);
    }
    
    setMessages([userMsg, assistantMsg]);
  };

  return (
    <div className="h-screen w-screen bg-gray-50 flex overflow-hidden">
      {/* LEFT SIDEBAR - History */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <img 
                src="/Logo.png" 
                alt="StudyFlow" 
                className="w-8 h-8" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null; 
                  target.style.display = 'none';
                }}
              />
              <h1 className="text-xl font-bold text-gray-800">
                Study<span className="text-indigo-600">Flow</span>
              </h1>
            </div>
          </div>
          
          <button
            onClick={startNewConversation}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <Plus size={18} />
            New Chat
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex items-center gap-2 mb-3 px-2">
            <History className="text-gray-500 w-4 h-4" />
            <h2 className="text-sm font-semibold text-gray-600 uppercase">History</h2>
          </div>
          
          <div className="space-y-2">
            {history.length > 0 ? (
              history.map((item) => (
                <HistoryBarItem 
                  key={item.id} 
                  item={item} 
                  isActive={currentConversationId === item.id} 
                  onClick={() => handleLoadHistory(item)}
                />
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center mt-8 italic">No history yet</p>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT MAIN AREA */}
      <div className="flex-1 flex flex-col">
        {/* Messages Area - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            // Welcome Screen
            <div className="h-full flex flex-col items-center justify-center p-8">
              <img 
                src="/Logo.png" 
                alt="StudyFlow Logo" 
                className="w-24 h-24 mb-6" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%236366f1"/%3E%3Ctext x="50" y="65" font-size="50" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="bold"%3ESF%3C/text%3E%3C/svg%3E';
                }}
              />
              <p className="text-gray-500 text-center max-w-md mb-8">
                Transform your notes or PDFs into summaries, flashcards, and study timetables with AI
              </p>
              
              <div className="grid grid-cols-3 gap-4 max-w-2xl">
                <div className="p-4 bg-white rounded-lg border border-gray-200 text-center">
                  <BookOpenText className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-800 mb-1">Summaries</h3>
                  <p className="text-sm text-gray-500">Concise overviews</p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-200 text-center">
                  <Layers3 className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-800 mb-1">Flashcards</h3>
                  <p className="text-sm text-gray-500">Interactive study cards</p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-200 text-center">
                  <CalendarCheck className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-800 mb-1">Timetables</h3>
                  <p className="text-sm text-gray-500">Structured schedules</p>
                </div>
              </div>
            </div>
          ) : (
            // Messages Display
            <div className="max-w-4xl mx-auto w-full p-6 space-y-6">
              {messages.map((message, idx) => (
                <MessageBubble key={idx} message={message} />
              ))}
              
              {loading && (
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 text-indigo-600">
                      <Loader2 className="animate-spin" size={24} />
                      <p className="text-gray-600">Processing your {uploadedFile ? 'PDF' : 'notes'}...</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area - Fixed at Bottom */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
              {/* File Upload Display */}
              {uploadedFile && (
                <div className="px-4 pt-3">
                  <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <File className="w-5 h-5 text-indigo-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{uploadedFile.name}</p>
                      <p className="text-xs text-gray-500">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      onClick={removeUploadedFile}
                      className="p-1 hover:bg-indigo-100 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              )}
              
              <textarea
                className="w-full p-4 bg-transparent resize-none focus:outline-none text-gray-700"
                placeholder={uploadedFile ? "PDF uploaded! Click a button below to generate..." : "Paste your lecture notes, articles, or study material here..."}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                disabled={!!uploadedFile}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey && !uploadedFile) {
                    e.preventDefault();
                    if (notes.trim()) handleGenerate('summary');
                  }
                }}
              />
              
              <div className="flex items-center justify-between px-4 pb-3">
                <div className="flex gap-2">
                  <ActionButton 
                    icon={<BookOpenText size={18} />} 
                    label="Summary" 
                    onClick={() => handleGenerate('summary')} 
                    disabled={loading || (!notes.trim() && !uploadedFile)}
                  />
                  <ActionButton 
                    icon={<Layers3 size={18} />} 
                    label="Flashcards" 
                    onClick={() => handleGenerate('flashcards')} 
                    disabled={loading || (!notes.trim() && !uploadedFile)}
                  />
                  <ActionButton 
                    icon={<CalendarCheck size={18} />} 
                    label="Timetable" 
                    onClick={() => handleGenerate('timetable')} 
                    disabled={loading || (!notes.trim() && !uploadedFile)}
                  />
                </div>
                
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading || !!uploadedFile}
                    className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Upload PDF"
                  >
                    <Upload size={20} />
                  </button>
                  
                  <button
                    onClick={() => handleGenerate('summary')}
                    disabled={loading || (!notes.trim() && !uploadedFile)}
                    className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-gray-400 text-center mt-2">
              {uploadedFile ? "Click a button to process your PDF" : "Press Ctrl+Enter for quick summary or upload a PDF"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Message Bubble Component
function MessageBubble({ message }: { message: Message }) {
  if (message.role === 'user') {
    return (
      <div className="flex items-start gap-4 justify-end">
        <div className="bg-indigo-600 text-white rounded-2xl p-4 max-w-3xl shadow-sm">
          {message.fileName && (
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-indigo-400">
              <File className="w-4 h-4" />
              <span className="text-sm font-medium">{message.fileName}</span>
            </div>
          )}
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
          <MessageSquare className="w-5 h-5 text-gray-600" />
        </div>
      </div>
    );
  }
  
  // Assistant message
  return (
    <div className="flex items-start gap-4">
      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-5 h-5 text-indigo-600" />
      </div>
      
      <div className="flex-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        {message.type === 'summary' && message.data?.summary && (
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
              <BookOpenText className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-gray-800">Summary</h3>
            </div>
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {message.data.summary}
            </div>
          </div>
        )}
        
        {message.type === 'flashcards' && message.data?.flashcards && (
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
              <Layers3 className="w-5 h-5 text-indigo-500" />
              <h3 className="font-semibold text-gray-800">Flashcards</h3>
            </div>
            <div className="space-y-3">
              {message.data.flashcards.map((card: Flashcard, idx: number) => (
                <FlashcardItem key={idx} card={card} idx={idx} />
              ))}
            </div>
          </div>
        )}
        
        {message.type === 'timetable' && message.data?.timetable && (
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
              <CalendarCheck className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold text-gray-800">Study Timetable</h3>
            </div>
            <div className="space-y-3">
              {message.data.timetable.map((item: TimetableItem, idx: number) => (
                <TimetableItemDisplay key={idx} item={item} />
              ))}
            </div>
          </div>
        )}
        
        {message.content && !message.type && (
          <p className="text-gray-700">{message.content}</p>
        )}
      </div>
    </div>
  );
}

// History Bar Item
function HistoryBarItem({ item, isActive, onClick }: { item: HistoryItem, isActive: boolean, onClick: () => void }) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getTypeIcon = (type: string) => {
    if (type === 'summary') return <BookOpenText className="w-4 h-4 text-green-500" />;
    if (type === 'flashcards') return <Layers3 className="w-4 h-4 text-indigo-500" />;
    if (type === 'timetable') return <CalendarCheck className="w-4 h-4 text-purple-500" />;
    return null;
  };

  return (
    <div 
      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 
        ${isActive 
          ? 'bg-indigo-50 border border-indigo-200' 
          : 'hover:bg-gray-50'
        }
      `}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-1">
        {getTypeIcon(item.type)}
        <span className="text-xs font-medium text-gray-500 uppercase">{item.type}</span>
      </div>
      <p className="text-sm text-gray-700 line-clamp-2 mb-1">
        {item.input_text.substring(0, 50)}...
      </p>
      <span className="text-xs text-gray-400">
        {formatTimestamp(item.timestamp)}
      </span>
    </div>
  );
}

// Flashcard Component
function FlashcardItem({ card, idx }: { card: Flashcard, idx: number }) {
  const [showAnswer, setShowAnswer] = useState(false);
  
  return (
    <div 
      className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 
        ${showAnswer 
          ? 'bg-indigo-50 border-indigo-300' 
          : 'bg-gray-50 border-gray-200 hover:border-gray-300'
        }
      `}
      onClick={() => setShowAnswer(!showAnswer)}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          {showAnswer ? 'Answer' : 'Question'} {idx + 1}
        </span>
        <Zap className={`w-4 h-4 ${showAnswer ? 'text-green-500' : 'text-indigo-400'}`} />
      </div>
      
      <p className="font-medium text-gray-800">
        {showAnswer ? card.back : card.front}
      </p>
      
      <div className="text-xs text-gray-400 mt-2">
        Click to {showAnswer ? 'hide' : 'reveal'}
      </div>
    </div>
  );
}

// Timetable Item
function TimetableItemDisplay({ item }: { item: TimetableItem }) {
  return (
    <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="bg-indigo-600 text-white font-bold py-2 px-3 rounded-md text-sm min-w-[80px] text-center">
        {item.time}
      </div>
      <div className="flex-1 font-medium text-gray-800 ml-3 text-sm">
        {item.activity}
      </div>
      <ChevronRight className="text-gray-300" size={18} />
    </div>
  );
}

// Action Button
function ActionButton({ icon, label, onClick, disabled }: any) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 py-2 px-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium text-gray-700"
    >
      {icon}
      {label}
    </button>
  );
}

export default Dashboard;