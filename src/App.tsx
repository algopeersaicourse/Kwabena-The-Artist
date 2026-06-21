import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Circle } from 'react-konva';
import { 
  Eraser, 
  Pencil, 
  Trash2, 
  Download, 
  MessageSquare, 
  BookOpen, 
  Sparkles, 
  Send,
  ChevronRight,
  ChevronLeft,
  Palette,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import confetti from 'canvas-confetti';
import { cn } from './lib/utils';
import { DRAWING_PRINCIPLES, type Message, type DrawingPrinciple } from './types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function App() {
  // Drawing State
  const [tool, setTool] = useState<'pencil' | 'eraser'>('pencil');
  const [lines, setLines] = useState<any[]>([]);
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(5);
  const isDrawing = useRef(false);
  const stageRef = useRef<any>(null);

  // UI State
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isPrinciplesOpen, setIsPrinciplesOpen] = useState(false);
  const [activePrinciple, setActivePrinciple] = useState<DrawingPrinciple | null>(null);
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm Kwabena, your personal art mentor. I can help you learn drawing principles or generate reference images for you. What would you like to draw today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleMouseDown = (e: any) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, { tool, points: [pos.x, pos.y], color, strokeWidth }]);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing.current) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);
    lines.splice(lines.length - 1, 1, lastLine);
    setLines(lines.concat());
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const clearCanvas = () => {
    setLines([]);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const downloadImage = () => {
    const uri = stageRef.current.toDataURL();
    const link = document.createElement('a');
    link.download = 'kwabena-masterpiece.png';
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const isImageRequest = userMessage.toLowerCase().includes('draw') || 
                             userMessage.toLowerCase().includes('picture') || 
                             userMessage.toLowerCase().includes('image') ||
                             userMessage.toLowerCase().includes('generate');

      if (isImageRequest) {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: [{ text: `A high-quality artistic reference drawing of: ${userMessage}. Simple lines, clear shapes, suitable for a beginner to copy.` }],
          config: {
            imageConfig: { aspectRatio: "1:1" }
          }
        });

        let imageUrl = '';
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }

        if (imageUrl) {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: "Here's a reference image for you! Try to break it down into simple shapes.",
            image: imageUrl
          }]);
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: "I couldn't generate that image right now, but I can still give you tips on how to draw it!" }]);
        }
      } else {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: userMessage,
          config: {
            systemInstruction: "You are Kwabena, a friendly and encouraging art teacher. Keep your advice practical, focusing on drawing principles like line, shape, form, and value. Be concise and inspiring."
          }
        });
        setMessages(prev => [...prev, { role: 'assistant', content: response.text || "I'm here to help you draw!" }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having a bit of trouble connecting right now. Let's keep drawing!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans overflow-hidden">
      {/* Sidebar - Principles */}
      <div className={cn(
        "bg-white border-r border-black/5 transition-all duration-300 flex flex-col",
        isPrinciplesOpen ? "w-80" : "w-0 overflow-hidden"
      )}>
        <div className="p-6 border-b border-black/5 flex justify-between items-center">
          <h2 className="font-serif italic text-xl">Art Principles</h2>
          <button onClick={() => setIsPrinciplesOpen(false)} className="p-1 hover:bg-black/5 rounded">
            <ChevronLeft size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {DRAWING_PRINCIPLES.map((p) => (
            <div 
              key={p.title} 
              className={cn(
                "p-4 rounded-2xl border transition-all cursor-pointer",
                activePrinciple?.title === p.title ? "border-black bg-black text-white" : "border-black/5 hover:border-black/20"
              )}
              onClick={() => setActivePrinciple(activePrinciple?.title === p.title ? null : p)}
            >
              <h3 className="font-medium mb-2">{p.title}</h3>
              <p className={cn("text-sm opacity-70", activePrinciple?.title === p.title && "opacity-90")}>
                {p.description}
              </p>
              {activePrinciple?.title === p.title && (
                <ul className="mt-4 space-y-2 text-xs">
                  {p.tips.map((tip, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="opacity-50">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className="h-16 border-b border-black/5 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white">
              <Palette size={20} />
            </div>
            <h1 className="font-serif italic text-2xl tracking-tight">Kwabena The Artist</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsPrinciplesOpen(!isPrinciplesOpen)}
              className={cn("p-2 rounded-xl transition-colors", isPrinciplesOpen ? "bg-black text-white" : "hover:bg-black/5")}
              title="Principles"
            >
              <BookOpen size={20} />
            </button>
            <div className="h-6 w-px bg-black/10 mx-2" />
            <button 
              onClick={clearCanvas}
              className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-colors"
              title="Clear Canvas"
            >
              <Trash2 size={20} />
            </button>
            <button 
              onClick={downloadImage}
              className="p-2 hover:bg-black/5 rounded-xl transition-colors"
              title="Download Masterpiece"
            >
              <Download size={20} />
            </button>
          </div>
        </header>

        {/* Canvas Area */}
        <main className="flex-1 bg-[#F5F5F3] p-8 flex items-center justify-center relative overflow-hidden">
          <div className="bg-white shadow-2xl rounded-sm border border-black/5 overflow-hidden">
            <Stage
              width={window.innerWidth > 1200 ? 800 : window.innerWidth - 400}
              height={600}
              onMouseDown={handleMouseDown}
              onMousemove={handleMouseMove}
              onMouseup={handleMouseUp}
              ref={stageRef}
              className="cursor-crosshair"
            >
              <Layer>
                {lines.map((line, i) => (
                  <Line
                    key={i}
                    points={line.points}
                    stroke={line.color}
                    strokeWidth={line.strokeWidth}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                    globalCompositeOperation={
                      line.tool === 'eraser' ? 'destination-out' : 'source-over'
                    }
                  />
                ))}
              </Layer>
            </Stage>
          </div>

          {/* Floating Toolbar */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl border border-black/5 p-2 rounded-2xl shadow-xl flex items-center gap-2">
            <button 
              onClick={() => setTool('pencil')}
              className={cn("p-3 rounded-xl transition-all", tool === 'pencil' ? "bg-black text-white scale-110" : "hover:bg-black/5")}
            >
              <Pencil size={20} />
            </button>
            <button 
              onClick={() => setTool('eraser')}
              className={cn("p-3 rounded-xl transition-all", tool === 'eraser' ? "bg-black text-white scale-110" : "hover:bg-black/5")}
            >
              <Eraser size={20} />
            </button>
            <div className="w-px h-8 bg-black/10 mx-1" />
            <input 
              type="color" 
              value={color} 
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent"
            />
            <div className="w-px h-8 bg-black/10 mx-1" />
            <input 
              type="range" 
              min="1" 
              max="50" 
              value={strokeWidth} 
              onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
              className="w-24 accent-black"
            />
          </div>
        </main>
      </div>

      {/* Chatbot Panel */}
      <div className={cn(
        "bg-white border-l border-black/5 transition-all duration-300 flex flex-col relative",
        isChatOpen ? "w-96" : "w-0 overflow-hidden"
      )}>
        <div className="p-6 border-b border-black/5 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-500" />
            <h2 className="font-medium">Mentor Chat</h2>
          </div>
          <button onClick={() => setIsChatOpen(false)} className="p-1 hover:bg-black/5 rounded">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={cn(
              "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed",
              msg.role === 'user' 
                ? "bg-black text-white ml-auto rounded-tr-none" 
                : "bg-[#F5F5F3] mr-auto rounded-tl-none"
            )}>
              {msg.content}
              {msg.image && (
                <div className="mt-3 rounded-lg overflow-hidden border border-black/10">
                  <img src={msg.image} alt="AI Reference" className="w-full h-auto" referrerPolicy="no-referrer" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="bg-[#F5F5F3] p-4 rounded-2xl rounded-tl-none mr-auto flex items-center gap-2 text-sm opacity-70">
              <Loader2 size={14} className="animate-spin" />
              Kwabena is thinking...
            </div>
          )}
        </div>

        <div className="p-4 border-t border-black/5 bg-white">
          <div className="relative">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask for a reference or drawing tip..."
              className="w-full pl-4 pr-12 py-3 bg-[#F5F5F3] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-black/20"
            />
            <button 
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black text-white rounded-lg disabled:opacity-50 transition-opacity"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[10px] text-center mt-2 opacity-40">
            Tip: Ask "Draw a cat" to get a reference image.
          </p>
        </div>
      </div>

      {/* Toggle Chat Button (when closed) */}
      {!isChatOpen && (
        <button 
          onClick={() => setIsChatOpen(true)}
          className="absolute right-6 bottom-6 w-14 h-14 bg-black text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50"
        >
          <MessageSquare size={24} />
        </button>
      )}
    </div>
  );
}
