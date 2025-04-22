import { useState } from 'react';
import { FileText, MessageSquare, History } from 'lucide-react';
import DocumentUploader from '@/components/DocumentUploader';
import PDFViewer from '@/components/PDFViewer';
import ChatInterface from '@/components/ChatInterface';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { extractTextFromPDF } from '@/services/pdfService';
import { generateAnswer } from '@/services/aiService';
import { PageContent } from '@/types/pdf';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';

const Index = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfText, setPdfText] = useState<string>('');
  const [pageContents, setPageContents] = useState<PageContent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('viewer');

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setPdfFile(file);
    
    try {
      let text = '';
      let pages: PageContent[] = [];
      
      if (file.type === 'application/pdf') {
        const result = await extractTextFromPDF(file);
        text = result.fullText;
        pages = result.pageContents;
      } else {
        console.log('File type detected:', file.type);
        text = 'Document type support coming soon. Currently only PDF files are fully supported.';
      }
      
      setPdfText(text);
      setPageContents(pages);
      console.log('Extracted text length:', text.length);
    } catch (error) {
      console.error('Error extracting text:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskQuestion = async (question: string): Promise<string> => {
    try {
      const { context, pages } = findRelevantContext(pdfText, pageContents, question);
      const answer = await generateAnswer(context, pages, question);
      return answer;
    } catch (error) {
      console.error('Error answering question:', error);
      return "I encountered an error while trying to answer your question. Please try again.";
    }
  };

  const clearPDF = () => {
    setPdfFile(null);
    setPdfText('');
    setPageContents([]);
  };

  const findRelevantContext = (
    text: string,
    pages: PageContent[],
    query: string
  ): { context: string, pages: number[] } => {
    if (!text || text.trim() === '') {
      return { context: '', pages: [] };
    }
    
    const searchTerm = query.toLowerCase().trim();
    
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
    
    const exactMatches = paragraphs.filter(paragraph => {
      const paragraphLower = paragraph.toLowerCase();
      const topicPattern = new RegExp(`(^|\\n|\\d+\\.|•|\\*)\\s*${searchTerm}\\b[:\\s]`, 'i');
      return topicPattern.test(paragraph);
    });

    let relevantParagraphs: string[] = [];
    if (exactMatches.length > 0) {
      relevantParagraphs = exactMatches;
    } else {
      const relatedMatches = paragraphs.filter(paragraph => {
        const paragraphLower = paragraph.toLowerCase();
        return paragraphLower.includes(searchTerm);
      });
      
      if (relatedMatches.length > 0) {
        relevantParagraphs = relatedMatches;
      }
    }
    
    if (relevantParagraphs.length === 0) {
      return { 
        context: `No specific information found about "${searchTerm}" in the document.`,
        pages: [] 
      };
    }
    
    const matchedPages: number[] = [];
    for (const paragraph of relevantParagraphs) {
      for (const pageContent of pages) {
        if (pageContent.text.includes(paragraph.substring(0, 100))) {
          if (!matchedPages.includes(pageContent.pageNum)) {
            matchedPages.push(pageContent.pageNum);
          }
          break;
        }
      }
    }
    
    return {
      context: relevantParagraphs.join('\n\n'),
      pages: matchedPages.sort((a, b) => a - b)
    };
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
          <Button 
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            Get started now
          </Button>
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
              
              <TabsContent value="chat" className="p-6">
                <ChatInterface
                  pdfText={pdfText}
                  onAskQuestion={handleAskQuestion}
                  isLoading={isLoading}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
