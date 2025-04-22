
import * as pdfjsLib from 'pdfjs-dist';

// Set the PDF.js worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Extracts text from a PDF file
 * @param file The PDF file to extract text from
 * @returns A promise that resolves to the extracted text
 */
export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const typedArray = new Uint8Array(arrayBuffer);
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: typedArray });
    const pdf = await loadingTask.promise;
    
    // Extract text from each page
    let fullText = '';
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const textItems = textContent.items.map(item => 'str' in item ? item.str : '');
      const pageText = textItems.join(' ');
      
      fullText += pageText + ' ';
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

/**
 * Simple text-based search function to find relevant context from PDF text
 * @param pdfText The full PDF text
 * @param question The user's question
 * @returns Relevant context from the PDF
 */
export const findRelevantContext = (pdfText: string, question: string): string => {
  // Get keywords from the question (simple approach)
  const keywords = question
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(' ')
    .filter(word => word.length > 3 && !['what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how', 'does', 'did', 'about', 'with'].includes(word));
  
  // Split PDF text into sentences (simple approach)
  const sentences = pdfText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Score each sentence based on keyword matches
  const scoredSentences = sentences.map(sentence => {
    const sentenceLower = sentence.toLowerCase();
    let score = 0;
    
    keywords.forEach(keyword => {
      if (sentenceLower.includes(keyword)) {
        score += 1;
      }
    });
    
    return { sentence, score };
  });
  
  // Sort by score and take top results
  const topSentences = scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(item => item.sentence);
  
  return topSentences.join('. ');
};

/**
 * Simple function to answer questions about the PDF content
 * @param pdfText The full PDF text
 * @param question The user's question
 * @returns An answer to the question based on the PDF content
 */
export const answerQuestion = async (pdfText: string, question: string): Promise<string> => {
  try {
    if (!pdfText || pdfText.trim() === '') {
      return "I don't see any text in the PDF. Please upload a valid PDF with text content.";
    }
    
    // Find relevant context
    const context = findRelevantContext(pdfText, question);
    
    if (!context || context.trim() === '') {
      return "I couldn't find information related to your question in the PDF. Could you try asking something else?";
    }
    
    // Simple answer generation (normally would use a language model here)
    // For now, we'll just return relevant context with a prefix
    return `Based on the PDF content: ${context}`;
  } catch (error) {
    console.error('Error answering question:', error);
    return "I encountered an error while processing your question. Please try again.";
  }
};
