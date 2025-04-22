
import { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import { generateAnswer } from '@/services/aiService';
import { findRelevantContext, extractTextFromPDF } from '@/services/pdfService';
import { useToast } from '@/hooks/use-toast';
import DocumentUploader from '@/components/DocumentUploader';

const Chat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pdfText, setPdfText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUploadedDocument, setHasUploadedDocument] = useState(false);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    
    try {
      const result = await extractTextFromPDF(file);
      setPdfText(result.fullText);
      setHasUploadedDocument(true);
      toast({
        title: "Success",
        description: "Document uploaded successfully. Starting chat...",
      });
    } catch (error) {
      console.error('Error extracting text:', error);
      toast({
        title: "Error",
        description: "Failed to process the document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskQuestion = async (question: string): Promise<string> => {
    try {
      setIsLoading(true);
      if (!pdfText) {
        return "Please upload a document first to ask questions about it.";
      }
      
      const { context, pages } = findRelevantContext(pdfText, [], question);
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
        {!hasUploadedDocument ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">👋 Hello! I'm AskNoteBot</h2>
                <p className="text-gray-600">Please upload a document to start our conversation.</p>
              </div>
              <div className="border-2 border-dashed rounded-lg p-8">
                <div className="flex flex-col items-center">
                  <FileText className="h-12 w-12 text-blue-600 mb-4" />
                  <h3 className="text-lg font-medium mb-2">📄 Drop your document here</h3>
                  <DocumentUploader onFileUpload={handleFileUpload} isLoading={isLoading} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1">
            <ChatInterface 
              pdfText={pdfText}
              onAskQuestion={handleAskQuestion}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
