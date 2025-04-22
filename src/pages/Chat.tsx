
import { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { generateAnswer } from '@/services/aiService';
import { findRelevantContext } from '@/services/pdfService';
import { PageContent } from '@/types/pdf';
import { useToast } from '@/hooks/use-toast';

const Chat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { pdfText, pageContents = [] } = location.state || { pdfText: '', pageContents: [] };
  const [isLoading, setIsLoading] = useState(false);

  const handleAskQuestion = async (question: string): Promise<string> => {
    try {
      setIsLoading(true);
      if (!pdfText) {
        return "Please upload a document first to ask questions about it.";
      }
      
      const { context, pages } = findRelevantContext(pdfText, pageContents, question);
      const answer = await generateAnswer(context, pages, question);
      return answer;
    } catch (error) {
      console.error('Error answering question:', error);
      toast({
        title: "Error",
        description: "Failed to process your question. Please try again.",
        variant: "destructive"
      });
      return "I encountered an error while processing your question. Please try again.";
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  if (!pdfText) {
    return (
      <div className="h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <p className="text-gray-600">No document loaded. Please upload a document first.</p>
          <Button onClick={handleBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col">
        <div className="border-b p-4">
          <Button 
            variant="ghost" 
            className="flex items-center text-gray-600"
            onClick={handleBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="flex-1">
          <ChatInterface 
            pdfText={pdfText}
            onAskQuestion={handleAskQuestion}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default Chat;
