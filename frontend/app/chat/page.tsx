'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  "Is it safe to take my child to school today?",
  "What can I do indoors to protect my family from smog?",
  "How do I make a DIY air purifier at home?",
  "What are the health risks of Delhi's current AQI?",
  "Suggest a sustainable alternative to my diesel car",
  "मेरे घर की हवा कैसे साफ करूं?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: "🌿 **Namaste! Main Hawa Dost hun.**\n\nMujhe batao — aap kahan hain? Main aapke sheher ki hawa ki sthiti dekhke aapko ek-dum sahi salah deta hun.\n\n*(Tell me your city and I'll check the current air quality before giving you advice!)*",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState('Delhi');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text?: string) {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMessage: Message = { role: 'user', content: messageText, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    const assistantMessage: Message = { role: 'model', content: '', timestamp: new Date() };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await fetch(`${API_URL}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          location,
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          const data = line.replace('data: ', '');
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              accumulated += parsed.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...updated[updated.length - 1], content: accumulated };
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: '⚠️ Sorry, I had trouble connecting. Please check your backend is running and try again.',
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="glass-card p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-800 flex items-center justify-center text-xl">🌿</div>
          <div>
            <p className="font-semibold text-green-400">Hawa Dost</p>
            <p className="text-xs text-gray-500">AI Air Quality Advisor · {loading ? 'typing...' : 'online'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Your city"
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-300 w-32 focus:outline-none focus:border-green-500"
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-green-800 flex items-center justify-center text-sm mr-2 mt-1 flex-shrink-0">🌿</div>
              )}
              <div
                className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user' ? 'chat-user text-white' : 'chat-assistant text-gray-200'
                }`}
              >
                {msg.role === 'model' ? (
                  <ReactMarkdown
                    components={{
                      strong: ({ children }) => <strong className="text-green-400">{children}</strong>,
                      em: ({ children }) => <em className="text-yellow-400">{children}</em>,
                      li: ({ children }) => <li className="ml-4 list-disc text-gray-300">{children}</li>,
                    }}
                  >
                    {msg.content || '▌'}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          {SUGGESTIONS.slice(0, 3).map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="flex-shrink-0 text-xs bg-green-900/30 border border-green-800/50 text-green-400 px-3 py-1.5 rounded-full hover:bg-green-900/50 transition"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Ask Hawa Dost anything... (Hindi or English)"
          disabled={loading}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition disabled:opacity-50"
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl transition font-medium"
        >
          {loading ? '...' : '➤'}
        </button>
      </div>
    </div>
  );
}

