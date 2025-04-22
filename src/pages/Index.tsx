
import { useState, useEffect } from 'react';
import PDFUploader from '@/components/PDFUploader';
import PDFViewer from '@/components/PDFViewer';
import ChatInterface from '@/components/ChatInterface';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { extractTextFromPDF } from '@/services/pdfService';
import { findRelevantContext } from '@/services/pdfService';
import { generateAnswer } from '@/services/aiService';
import { FileText, MessageSquare } from 'lucide-react';

const Index = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfText, setPdfText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('viewer');

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setPdfFile(file);
    
    try {
      const text = await extractTextFromPDF(file);
      setPdfText(text);
      console.log('Extracted text length:', text.length);
    } catch (error) {
      console.error('Error extracting text:', error);
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskQuestion = async (question: string): Promise<string> => {
    try {
      // Find relevant context from the PDF text
      const context = findRelevantContext(pdfText, question);
      
      // Generate an answer based on the context and question
      const answer = await generateAnswer(context, question);
      
      return answer;
    } catch (error) {
      console.error('Error answering question:', error);
      return "I encountered an error while trying to answer your question. Please try again.";
    }
  };

  const clearPDF = () => {
    setPdfFile(null);
    setPdfText('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-700 text-white py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold flex items-center">
            <FileText className="mr-2" />
            PDF Knowledge Vault
          </h1>
          <p className="mt-2 text-blue-100">
            Upload a PDF, then ask questions about its content
          </p>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
              <PDFUploader onFileUpload={handleFileUpload} isLoading={isLoading} />
              
              {pdfFile && (
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm" onClick={clearPDF}>
                    Clear PDF
                  </Button>
                </div>
              )}
            </div>
            
            {pdfText && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Document Info</h2>
                <div className="text-sm text-gray-600">
                  <p className="mb-2">
                    <span className="font-medium">Filename:</span> {pdfFile?.name}
                  </p>
                  <p className="mb-2">
                    <span className="font-medium">Size:</span> {pdfFile ? `${(pdfFile.size / 1024 / 1024).toFixed(2)} MB` : ''}
                  </p>
                  <p>
                    <span className="font-medium">Text Length:</span> {pdfText.length.toLocaleString()} characters
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="lg:col-span-2">
            {pdfFile ? (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
                  
                  <TabsContent value="chat" className="p-6">
                    <ChatInterface
                      pdfText={pdfText}
                      onAskQuestion={handleAskQuestion}
                      isLoading={isLoading}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                <FileText className="h-16 w-16 mx-auto text-blue-600 mb-4" />
                <h2 className="text-2xl font-semibold mb-2">No PDF Uploaded</h2>
                <p className="text-gray-600 mb-6">
                  Upload a PDF document to view it and ask questions about its content.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <footer className="border-t mt-16 py-8 bg-white">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>PDF Knowledge Vault — Extract insights from your documents</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
