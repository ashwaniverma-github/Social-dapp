"use client";

import { useState, useEffect, useRef } from "react";
import { CircleArrowUp } from "lucide-react";
import Image from "next/image";
interface ChatMessage {
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  displayText: string;
  isImage?: boolean;
  isLoading?: boolean;
}

interface ChatWindowProps {
  influencerName: string;
  onClose: () => void;
}

const formatResponseText = (text: string) => {
  return text.split(/(\*\*.*?\*\*|\*.*?\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="text-purple-300">
          {part.slice(2, -2)}
        </strong>
      );
    } else if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={index} className="text-gray-300 italic">
          {part.slice(1, -1)}
        </em>
      );
    } else {
      return <span key={index}>{part}</span>;
    }
  });
};

export default function ChatWindow({ influencerName, onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Typing effect implementation
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage?.sender === "ai" && 
        !lastMessage.isLoading && 
        !lastMessage.isImage &&
        lastMessage.displayText.length < lastMessage.text.length) {
      const timer = setTimeout(() => {
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          newMessages[newMessages.length - 1] = {
            ...lastMsg,
            displayText: lastMessage.text.slice(0, lastMsg.displayText.length + 1)
          };
          return newMessages;
        });
      }, 20);

      return () => clearTimeout(timer);
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isProcessing) return;
    setIsProcessing(true);

    // Add user message
    const userMessage: ChatMessage = {
      sender: "user",
      text: input,
      displayText: input,
      timestamp: Date.now().toString(),
    };
    
    // Add temporary loading message without valid timestamp
    const loadingMessage: ChatMessage = {
      sender: "ai",
      text: "",
      displayText: "",
      timestamp: "", // Empty timestamp for loader
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInput("");

    try {
      const res = await fetch(`/api/ai/${influencerName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      
      if (!res.ok) throw new Error('Request failed');
      
      const data = await res.json();
      const isImageResponse = influencerName === 'artifex'; // Adjust based on your API
      
      const aiMessage: ChatMessage = {
        sender: "ai",
        text: data.response,
        displayText: isImageResponse ? "" : "", // Start empty for text responses
        timestamp: Date.now().toString(), // Valid timestamp only for actual response
        isImage: isImageResponse,
      };

      setMessages(prev => 
        prev.map(msg => msg.timestamp === loadingMessage.timestamp ? aiMessage : msg)
      );
      
    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => 
        prev.filter(msg => msg.timestamp !== loadingMessage.timestamp)
      );
      const errorMessage: ChatMessage = {
        sender: "ai",
        text: "Failed to generate response. Please try again.",
        displayText: "Failed to generate response. Please try again.",
        timestamp: Date.now().toString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(Number(timestamp));
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
  };

  return (
    <div className="flex flex-col w-full h-full max-h-[600px] sm:max-w-md md:max-w-lg lg:max-w-2xl bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 bg-purple-950 text-white">
        <h2 className="text-base sm:text-xl font-bold truncate">Chat with {influencerName}</h2>
        <button 
          onClick={onClose} 
          className="p-1 sm:p-2 rounded-full hover:bg-purple-900 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-4 bg-gray-900">
        {messages.map((msg, idx) => (
          <div 
            key={msg.timestamp || idx} 
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-xl sm:rounded-2xl p-2 sm:p-4 ${
                msg.sender === "user" 
                  ? "bg-purple-800 text-white" 
                  : "bg-gray-800 text-gray-100 shadow-md"
              }`}
            >
              <div className="break-words text-sm sm:text-base">
                {msg.isLoading ? (
                  <div className="flex items-center justify-center p-2">
                    <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-gray-300"></div>
                  </div>
                ) : msg.isImage ? (
                  <Image
                    src={msg.text}
                    width={600}
                    height={800}
                    alt="Generated content"
                    className="rounded-lg max-w-full h-auto"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <>
                    {formatResponseText(msg.displayText)}
                    {msg.sender === "ai" && msg.displayText.length < msg.text.length && (
                      <span className="ml-1 inline-block w-2 h-4 bg-gray-100 animate-blink" />
                    )}
                  </>
                )}
              </div>
              {/* Only show timestamp for non-loading messages */}
              {!msg.isLoading && (
                <p className={`text-xs mt-1 ${msg.sender === "user" ? "text-purple-300" : "text-gray-400"}`}>
                  {formatTimestamp(msg.timestamp)}
                </p>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-2 sm:p-4 border-t border-gray-700 bg-gray-900">
        <div className="flex gap-2">
          <textarea
            value={input}
            disabled={isProcessing}
            placeholder="Type your message..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !isProcessing) {
                e.preventDefault();
                sendMessage();
              }
            }}
            className="flex-1 resize-none p-2 sm:p-3 rounded-full focus:outline-none bg-gray-800 text-gray-100 placeholder-gray-400 disabled:opacity-50 text-sm sm:text-base"
            rows={1}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isProcessing}
            className="p-2 sm:p-3 h-auto rounded-full bg-purple-700 hover:bg-purple-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CircleArrowUp className="w-5 h-5 sm:w-6 sm:h-6 text-gray-100" />
          </button>
        </div>
      </div>
    </div>
  );
}