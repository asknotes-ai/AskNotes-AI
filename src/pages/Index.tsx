
import { useState } from 'react';
import { FileText, Heart, MessageSquare } from 'lucide-react';
import DocumentUploader from '@/components/DocumentUploader';
import PDFViewer from '@/components/PDFViewer';
import ChatInterface from '@/components/ChatInterface';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { extractTextFromPDF } from '@/services/pdfService';
import { generateAnswer } from '@/services/aiService';
import { PageContent } from '@/types/pdf';

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

  // Helper function to find relevant context
  const findRelevantContext = (
    text: string,
    pages: PageContent[],
    query: string
  ): { context: string, pages: number[] } => {
    if (!text || text.trim() === '') {
      return { context: '', pages: [] };
    }
    
    // Normalize the query/search term
    const searchTerm = query.toLowerCase().trim();
    
    // Split text into paragraphs
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
    
    // Find paragraphs that contain the exact topic
    const exactMatches = paragraphs.filter(paragraph => {
      const paragraphLower = paragraph.toLowerCase();
      // Look for topic definitions (e.g., "Bots:", "1. Bots", "• Bots")
      const topicPattern = new RegExp(`(^|\\n|\\d+\\.|•|\\*)\\s*${searchTerm}\\b[:\\s]`, 'i');
      return topicPattern.test(paragraph);
    });

    let relevantParagraphs: string[] = [];
    if (exactMatches.length > 0) {
      relevantParagraphs = exactMatches;
    } else {
      // If no exact topic match, find paragraphs containing the term
      const relatedMatches = paragraphs.filter(paragraph => {
        const paragraphLower = paragraph.toLowerCase();
        return paragraphLower.includes(searchTerm);
      });
      
      if (relatedMatches.length > 0) {
        relevantParagraphs = relatedMatches;
      }
    }
    
    // If no relevant paragraphs, return empty
    if (relevantParagraphs.length === 0) {
      return { 
        context: `No specific information found about "${searchTerm}" in the document.`,
        pages: [] 
      };
    }
    
    // Find page numbers for each matched paragraph
    const matchedPages: number[] = [];
    for (const paragraph of relevantParagraphs) {
      for (const pageContent of pages) {
        if (pageContent.text.includes(paragraph.substring(0, 100))) { // Using substring for partial matching
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
    <div className="min-h-screen bg-gradient-to-br from-cute-blue-light to-cute-pink-light">
      <header className="bg-cute-lavender text-cute-lavender-dark py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold flex items-center justify-center">
            <Heart className="mr-2 animate-cute-bounce text-cute-pink-dark" />
            PDF Cuddly Knowledge Vault 🐾
          </h1>
          <p className="mt-2 text-center text-cute-blue-dark">
            Upload a PDF, and let's explore its adorable contents! 💕
          </p>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
              <DocumentUploader onFileUpload={handleFileUpload} isLoading={isLoading} />
              
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
                  <p className="mb-2">
                    <span className="font-medium">Text Length:</span> {pdfText.length.toLocaleString()} characters
                  </p>
                  <p>
                    <span className="font-medium">Pages:</span> {pageContents.length}
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
