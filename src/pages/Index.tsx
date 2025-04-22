import { useState } from 'react';
import { FileText, MessageSquare, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DocumentUploader from '@/components/DocumentUploader';
import PDFViewer from '@/components/PDFViewer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { extractTextFromPDF } from '@/services/pdfService';
import { PageContent } from '@/types/pdf';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('viewer');

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setPdfFile(file);
    
    try {
      if (file.type === 'application/pdf') {
        const result = await extractTextFromPDF(file);
        navigate('/chat', { 
          state: { 
            pdfText: result.fullText,
            pageContents: result.pageContents 
          } 
        });
        toast({
          title: "Success",
          description: "Document uploaded successfully. Starting chat...",
        });
      } else {
        toast({
          title: "Unsupported Format",
          description: "Currently only PDF files are supported.",
          variant: "destructive"
        });
      }
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600 mb-4">
            Create AI-Powered Document Conversations 10X Faster
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Upload documents to AskNotes.AI and start intelligent conversations.
            Smart, simple, and adorable.
          </p>
          <DocumentUploader onFileUpload={handleFileUpload} isLoading={isLoading} />
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Smart Document Processing</h3>
            <p className="text-gray-600">
              Upload any document and our AI will analyze and understand its content.
            </p>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <MessageSquare className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Interactive Chat</h3>
            <p className="text-gray-600">
              Have natural conversations about your documents with our AI assistant.
            </p>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <History className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Knowledge History</h3>
            <p className="text-gray-600">
              Access your chat history and documents anytime you need them.
            </p>
          </Card>
        </div>

        {pdfFile && (
          <div className="mt-16">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="border-b px-6 py-3">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="viewer" className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    PDF Viewer
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="flex items-center">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Ask Questions
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="viewer" className="p-6">
                <PDFViewer file={pdfFile} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
