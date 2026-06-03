/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, RefreshCw, AlertCircle, HelpCircle, MessageSquare, ShieldAlert } from 'lucide-react';
import { AiMessage } from '../types';
import { communityService } from '../communityService';

interface AiAssistantProps {
  userId: string;
  onBack: () => void;
}

const SUGGESTED_PROMPTS = [
  {
    title: 'Explain Medications',
    desc: 'How does Hydroxyurea help SS genotype?',
    prompt: 'Can you carefully explain how Hydroxyurea work to help individuals with sickle cell SS genotype? What does it do to fetal hemoglobin (HbF)?'
  },
  {
    title: 'Dactylitis Symptoms',
    desc: 'Why do hands & feet swell in infants?',
    prompt: 'What causes dactylitis (hand-foot swelling) in infants with sickle cell, and how can parents manage this discomfort at home safely?'
  },
  {
    title: 'Pregnancy Carriers',
    desc: 'What is genetic transmission pattern?',
    prompt: 'If one parent is AS (trait) and the other is SS (sickle cell), what are the genetic possibilities for their children? Please map out the genotype probabilities.'
  },
  {
    title: 'Clinic Ask List',
    desc: 'Questions to ask my hematologist.',
    prompt: 'Suggest a list of concrete, productive questions I as a patient or caregiver can ask my hematologist during our next SCCA routine appointment.'
  }
];

export function AiAssistant({ userId, onBack }: AiAssistantProps) {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load chat session if existing
  useEffect(() => {
    const saved = communityService.getChatSessions(userId);
    if (saved && saved.length > 0) {
      setMessages(saved[0].messages);
    } else {
      // First welcome message
      const welcome: AiMessage = {
        id: 'welcome-msg',
        role: 'model',
        content: `👋 **Warm Greetings to you, Warrior!**
        
I am your **SCCA AI Assistant**, optimized to share educational knowledge about Sickle Cell Disease across the African continent and beyond.

I can help with:
- Explaining how medications like **Hydroxyurea** and **Folic Acid** support your body.
- Demystifying blood mechanisms, sickling cells, and vaso-occlusion (VOC) triggers.
- Explaining infant/child symptoms like dactylitis and splenomegaly.
- Generating draft checkups list to discuss with SCCA clinic specialists.

Feel free to use one of the quick topic buttons below or type your own concern.`,
        createdAt: new Date().toISOString()
      };
      setMessages([welcome]);
    }
  }, [userId]);

  // Scroll to bottom helper
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveHistory = (updated: AiMessage[]) => {
    communityService.saveChatSession(userId, {
      id: 'session-default',
      messages: updated,
      createdAt: new Date().toISOString()
    });
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputMsg).trim();
    if (!textToSend) return;

    if (!customPrompt) setInputMsg('');
    setErrorText(null);

    // Add user message
    const userMsg: AiMessage = {
      id: `m-user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      createdAt: new Date().toISOString()
    };

    const updatedWithUser = [...messages, userMsg];
    setMessages(updatedWithUser);
    saveHistory(updatedWithUser);
    setIsSending(true);

    try {
      const response = await fetch('/api/gemini/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          chatHistory: messages.filter(m => m.id !== 'welcome-msg') // exclude template welcome if too long
        })
      });

      if (!response.ok) {
        throw new Error('Server returned unsuccessful status while proxying request.');
      }

      const data = await response.json();
      
      const modelMsg: AiMessage = {
        id: `m-model-${Date.now()}`,
        role: 'model',
        content: data.text || 'No response returned from assistant.',
        createdAt: new Date().toISOString()
      };

      const finalMessages = [...updatedWithUser, modelMsg];
      setMessages(finalMessages);
      saveHistory(finalMessages);

    } catch (e: any) {
      console.error(e);
      setErrorText('Could not connect to the AI endpoint. Please verify you have is connected to the dev server on port 3000 and have completed full-stack build configurations.');
    } finally {
      setIsSending(false);
    }
  };

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear your conversation history?')) {
      const resetWelcome: AiMessage = {
        id: 'welcome-msg-reset',
        role: 'model',
        content: 'Conversation history reset successfully. How can SCCA AI support you now?',
        createdAt: new Date().toISOString()
      };
      setMessages([resetWelcome]);
      communityService.saveChatSession(userId, { id: 'session-default', messages: [resetWelcome], createdAt: new Date().toISOString() });
    }
  };

  // Safe visual text parsing for markdown-lite formatting
  const renderFormattedMessage = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, lIdx) => {
      let trimmed = line.trim();
      
      // Look for bullet list * or -
      const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('-');
      const isDisclaimer = trimmed.startsWith('🔴') || trimmed.includes('Medical Disclaimer');
      const isHeader = trimmed.startsWith('###') || trimmed.startsWith('##') || trimmed.startsWith('**');

      // Simple strong formatting replacement
      let processed = trimmed;
      if (isBullet) {
        processed = trimmed.substring(2);
      }
      
      // Parse intermediate **text** to bold tags
      const parts = processed.split('**');
      const renderedParts = parts.map((part, pIdx) => {
        if (pIdx % 2 === 1) {
          return <strong key={pIdx} className="font-extrabold text-slate-900">{part}</strong>;
        }
        return part;
      });

      if (isDisclaimer) {
        return (
          <div key={lIdx} className="my-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-800 text-[11px] leading-relaxed font-semibold flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>{renderedParts}</div>
          </div>
        );
      }

      if (isBullet) {
        return (
          <li key={lIdx} className="list-disc ml-4 pl-1 text-[11px] md:text-xs text-slate-700 leading-relaxed mb-1.5 font-normal">
            {renderedParts}
          </li>
        );
      }

      if (isHeader) {
        return (
          <h4 key={lIdx} className="text-xs font-black text-slate-800 tracking-tight mt-3 mb-1.5 block uppercase">
            {renderedParts}
          </h4>
        );
      }

      return (
        <p key={lIdx} className="text-[11px] md:text-xs text-slate-700 leading-relaxed mb-2 font-normal">
          {renderedParts}
        </p>
      );
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[calc(100vh-140px)] md:h-[620px] overflow-hidden">
      
      {/* Header and Disclaimer Block */}
      <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-brand-100 text-brand-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-xs">SCCA Edu-AI Assistant</h3>
            <span className="text-[9px] text-slate-500 block leading-none mt-0.5">Vetted Sickle Cell Knowledge Base</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={clearChat}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer text-xs flex items-center gap-1"
            title="Clear Chat history"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            onClick={onBack}
            className="py-1 px-3 bg-white text-slate-600 hover:bg-slate-50 rounded-lg text-[10px] border border-slate-200 transition font-bold"
          >
            Exit Chat
          </button>
        </div>
      </div>

      {/* Message Timeline */}
      <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 bg-slate-50/50">
        
        {messages.map((msg) => {
          const isModel = msg.role === 'model';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isModel ? 'justify-start' : 'justify-end'}`}
            >
              {isModel && (
                <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}
              
              <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm border ${isModel ? 'bg-white border-slate-100 text-slate-800' : 'bg-brand-600 border-brand-500 text-white'}`}>
                {isModel ? (
                  <div className="space-y-1 block">
                    {renderFormattedMessage(msg.content)}
                  </div>
                ) : (
                  <p className="text-[11px] md:text-xs font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                )}
                <span className={`text-[8px] font-mono block mt-1.5 text-right ${isModel ? 'text-slate-400' : 'text-brand-200'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>

              {!isModel && (
                <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-200 text-[10px] font-bold flex items-center justify-center uppercase shrink-0">
                  Me
                </div>
              )}
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-start gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-2">
              <span className="text-[10px] text-slate-400 animate-pulse font-medium">Assistant compiling medical search...</span>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 bg-brand-500 rounded-full animate-bounce delay-75"></div>
                <div className="w-1 h-1 bg-brand-500 rounded-full animate-bounce delay-150"></div>
                <div className="w-1 h-1 bg-brand-500 rounded-full animate-bounce delay-300"></div>
              </div>
            </div>
          </div>
        )}

        {errorText && (
          <div className="p-3.5 bg-red-50 border border-red-100 rounded-2xl text-red-800 text-[11px] flex gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p>{errorText}</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested prompting list (shown only when minimal chats exist) */}
      {messages.length < 3 && (
        <div className="p-4 bg-white border-t border-slate-100">
          <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 mb-2 block font-mono">Suggested Conversations:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SUGGESTED_PROMPTS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(item.prompt)}
                className="p-2.5 bg-slate-50 hover:bg-brand-50/40 border border-slate-100 text-left rounded-xl hover:border-brand-500/30 transition shadow-sm cursor-pointer group"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[10px] text-brand-900 group-hover:text-brand-600">{item.title}</span>
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <p className="text-[9px] text-slate-500 leading-normal mt-0.5 font-normal">{item.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat sending Form area */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        className="p-3 border-t border-slate-100 bg-white flex items-center gap-2"
      >
        <input
          type="text"
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          placeholder="Ask about medications, folic acid, pain crisis relief, warning signs..."
          disabled={isSending}
          className="flex-1 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 focus:bg-white text-xs select-none rounded-2xl focus:ring-1 focus:ring-brand-500 outline-none border border-slate-200 transition"
        />
        <button
          type="submit"
          disabled={isSending || !inputMsg.trim()}
          className="p-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-100 text-white disabled:text-slate-450 rounded-2xl transition cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
