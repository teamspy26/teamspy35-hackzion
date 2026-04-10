'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, CheckCircle, User, Bot, Loader2, Sparkles, Building2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface NegotiationBoxProps {
  source: string;
  destination: string;
  weight: number;
  baseCost: number;
  onAgreeDeal: (finalPrice: number) => void;
}

export default function NegotiationBox({ source, destination, weight, baseCost, onAgreeDeal }: NegotiationBoxProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I see you want to ship a ${weight}kg package from ${source} to ${destination}. I'm your AI sales agent. How can I help you finalize a great price for this today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [dealReached, setDealReached] = useState(false);
  const [finalPrice, setFinalPrice] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || dealReached) return;
    
    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          basePrice: baseCost,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || 'Invalid API response');
      }
      
      const { data } = json;
      let aiContent = data.reply || "I didn't understand that. Can we discuss the price?";
      
      // The AI might prepend DEAL_ACCEPTED to the message
      if (data.isDealAccepted || aiContent.includes('DEAL_ACCEPTED')) {
        const priceMatch = aiContent.match(/DEAL_ACCEPTED:\s*(\d+)/) || [];
        const extractedPrice = data.finalPrice || parseInt(priceMatch[1], 10) || baseCost;
        
        setDealReached(true);
        setFinalPrice(extractedPrice);
        
        aiContent = aiContent.replace(/DEAL_ACCEPTED:\s*\d+/, '').trim();
        if (!aiContent) {
            aiContent = `We have a deal at ${extractedPrice} INR! Click below to send this quote for manager approval.`;
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: aiContent }]);
    } catch (error) {
      console.error('Error negotiating:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Our system encountered an error. Please try again later.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col border border-zinc-200 rounded-2xl overflow-hidden h-[700px] bg-white shadow-md relative">
      {/* Header */}
      <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-tr from-brand-yellow to-orange-400 rounded-full flex items-center justify-center text-black shadow-sm">
              <Sparkles size={20} />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div>
            <div className="font-bold text-base text-[#111111]">Logistics Manager AI</div>
            <div className="text-xs text-zinc-500 font-medium">Enterprise Scale Pricing Engine</div>
          </div>
        </div>
        <div className="text-xs bg-zinc-100 text-zinc-600 px-3 py-1.5 rounded-full font-medium shadow-inner">
          Base Estimate: <strong className="text-zinc-900">{baseCost} INR</strong>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-zinc-50">
        <div className="max-w-3xl mx-auto space-y-8">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-4 `}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm ${m.role === 'user' ? 'bg-zinc-200 text-zinc-600' : 'bg-[#111111] text-white'}`}>
                {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="flex-1 space-y-2">
                <div className="font-bold text-xs text-zinc-800">
                  {m.role === 'user' ? 'You' : 'AI Sales Agent'}
                </div>
                <div className="text-[#111111] text-[15px] leading-relaxed whitespace-pre-wrap">
                  {m.content}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[#111111] text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                <Bot size={16} />
              </div>
              <div className="flex-1 space-y-2">
                <div className="font-bold text-xs text-zinc-800">AI Sales Agent</div>
                <div className="text-[#111111] text-[15px] leading-relaxed flex gap-1.5 items-center py-2">
                  <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Input Area (ChatGPT Style) */}
      <div className="p-4 bg-gradient-to-t from-zinc-50 to-transparent">
        <div className="max-w-3xl mx-auto">
          {dealReached ? (
            <div className="bg-green-500 text-white p-5 rounded-2xl flex items-center justify-between shadow-lg shadow-green-500/20 transition-all hover:scale-[1.01] cursor-default">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-2 rounded-full">
                  <CheckCircle size={24} className="text-white" />
                </div>
                <div>
                  <div className="font-bold text-lg">Deal Reached!</div>
                  <div className="text-green-50 text-sm">Final Negotiated Price: <strong className="text-white text-base ml-1">{finalPrice} INR</strong></div>
                </div>
              </div>
              <button 
                onClick={() => onAgreeDeal(finalPrice || baseCost)}
                className="px-6 py-2.5 bg-white text-green-700 text-sm font-bold rounded-xl hover:bg-green-50 transition-colors shadow-sm"
              >
                Send for Manager Approval
              </button>
            </div>
          ) : (
            <div className="relative shadow-sm rounded-2xl bg-white border border-zinc-300 focus-within:ring-2 focus-within:ring-brand-yellow focus-within:border-transparent transition-all">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Message AI Sales Negotiator..."
                className="w-full bg-transparent border-none px-5 py-4 pb-12 text-[15px] focus:outline-none resize-none max-h-32 text-zinc-900 placeholder:text-zinc-400"
                rows={1}
                disabled={loading}
              />
              <div className="absolute right-3 bottom-3">
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="w-8 h-8 rounded-full bg-[#111111] flex items-center justify-center text-white hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:hover:bg-[#111111]"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} className="mr-0.5 mt-0.5" />}
                </button>
              </div>
            </div>
          )}
          <div className="text-center mt-3 text-[11px] text-zinc-400 max-w-lg mx-auto">
            Logistics Manager AI can make mistakes. Please verify important negotiated terms with operations.
          </div>
        </div>
      </div>
    </div>
  );
}
