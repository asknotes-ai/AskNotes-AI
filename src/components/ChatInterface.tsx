import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, ArrowLeft, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useToast } from '@/hooks/use-toast';

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
      text: '👋 Hello! I am AskNoteBot. I can help you understand your document better. What would you like to know?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading || !pdfText) {
      if (!pdfText) {
        toast({
          title: "No Document",
          description: "Please upload a document first to ask questions.",
          variant: "destructive"
        });
      }
      return;
    }
    
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
      
      toast({
        title: "Error",
        description: "Failed to get an answer. Please try again.",
        variant: "destructive"
      });
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error while processing your question. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleLinkClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex h-full">
      <div className="w-64 border-r bg-gray-50 p-4">
        <div className="border rounded-lg p-4 mb-4 bg-white">
          <div className="flex items-center justify-center mb-2">
            <span className="text-blue-600">Drop PDF here</span>
          </div>
          <Button variant="outline" className="w-full">
            Browse
          </Button>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            Chat History (0/10)
          </div>
          <Button variant="ghost" size="sm">
            New Chat
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="border-b p-4">
          <Button variant="ghost" className="flex items-center text-gray-600">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
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

        <form 
          className="border-t p-4 flex items-center gap-2"
          onSubmit={handleSubmit}
        >
          <Input
            type="text"
            placeholder={
              !pdfText
                ? 'Upload a PDF first to ask questions'
                : isLoading
                ? 'Processing...'
                : 'Ask a question about your document...'
            }
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1"
            disabled={isLoading || !pdfText}
          />
          <Button 
            type="submit"
            disabled={isLoading || !inputValue.trim() || !pdfText}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
