
import ChatInterface from '@/components/ChatInterface';
import { useLocation } from 'react-router-dom';

const Chat = () => {
  const location = useLocation();
  const { pdfText } = location.state || { pdfText: '' };

  const handleAskQuestion = async (question: string): Promise<string> => {
    // For now, return a simple response
    return `I'll help you with your question about the document: ${question}`;
  };

  return (
    <div className="h-screen bg-white">
      <ChatInterface 
        pdfText={pdfText}
        onAskQuestion={handleAskQuestion}
        isLoading={false}
      />
    </div>
  );
};

export default Chat;
