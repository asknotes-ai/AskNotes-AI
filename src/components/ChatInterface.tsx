
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatInterfaceProps {
  pdfText: string;
  onAskQuestion: (question: string) => Promise<string>;
  isLoading: boolean;
}

const ChatInterface = ({ pdfText, onAskQuestion, isLoading }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I can answer questions about the uploaded PDF. What would you like to know?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading || !pdfText) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    
    try {
      const response = await onAskQuestion(inputValue);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error getting answer:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error while processing your question. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  // This handles markdown links in the bot responses
  const handleLinkClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-white">
      <div className="p-4 border-b bg-blue-600 text-white">
        <h3 className="text-lg font-medium flex items-center">
          <MessageSquare className="mr-2 h-5 w-5" />
          Ask about the PDF
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}
            >
              {message.sender === 'bot' ? (
                <div className="text-sm markdown-content">
                  <ReactMarkdown
                    components={{
                      a: ({ href, children }) => (
                        <button
                          onClick={() => handleLinkClick(href || '')}
                          className="text-blue-600 hover:underline flex items-center"
                        >
                          {children} <ExternalLink className="ml-1 h-3 w-3" />
                        </button>
                      ),
                    }}
                  >
                    {message.text}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm">{message.text}</p>
              )}
              <p
                className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="p-4 border-t flex" onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder={
            !pdfText
              ? 'Upload a PDF first to ask questions'
              : isLoading
              ? 'Processing...'
              : 'Ask a question about the PDF...'
          }
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-1 mr-2"
          disabled={isLoading || !pdfText}
        />
        <Button
          type="submit"
          disabled={isLoading || !inputValue.trim() || !pdfText}
        >
          <Search className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default ChatInterface;
