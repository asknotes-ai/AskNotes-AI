
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
      
      fullText += pageText + '\n\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

/**
 * Find relevant context from PDF text based on user's question
 * @param pdfText The full PDF text
 * @param question The user's question
 * @returns Relevant context from the PDF
 */
export const findRelevantContext = (pdfText: string, question: string): string => {
  if (!pdfText || pdfText.trim() === '') {
    return '';
  }
  
  // Normalize the question
  const questionLower = question.toLowerCase().trim();
  
  // Check if it's a summarization request
  if (questionLower.includes('summarize') || questionLower.includes('summary')) {
    return pdfText.length > 8000 ? pdfText.substring(0, 8000) : pdfText;
  }
  
  // Extract keywords from the question
  const keywords = extractKeywords(questionLower);
  
  // If no keywords were found, return a chunk of the document
  if (keywords.length === 0) {
    console.log("No keywords found in question");
    return pdfText.length > 5000 ? pdfText.substring(0, 5000) : pdfText;
  }
  
  console.log("Keywords extracted:", keywords);
  
  // Split text into paragraphs
  const paragraphs = pdfText.split(/\n\n+/).filter(p => p.trim().length > 0);
  
  // Score each paragraph based on keyword matches
  const scoredParagraphs = paragraphs.map(paragraph => {
    const paragraphLower = paragraph.toLowerCase();
    let score = 0;
    
    // Score based on keyword frequency
    keywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      const matches = paragraphLower.match(regex);
      if (matches) {
        score += matches.length;
      }
    });
    
    // Bonus points for paragraphs that contain multiple keywords
    let uniqueKeywordsFound = 0;
    keywords.forEach(keyword => {
      if (paragraphLower.includes(keyword)) {
        uniqueKeywordsFound++;
      }
    });
    
    score += uniqueKeywordsFound * 2; // Boost paragraphs with multiple keywords
    
    return { paragraph, score };
  });
  
  // Sort by relevance score and take top results
  const topParagraphs = scoredParagraphs
    .sort((a, b) => b.score - a.score)
    .slice(0, 5) // Increase the number of paragraphs for better context
    .filter(item => item.score > 0)
    .map(item => item.paragraph);
  
  console.log(`Found ${topParagraphs.length} relevant paragraphs`);
  
  // If no relevant paragraphs found, return a portion of the text
  if (topParagraphs.length === 0) {
    return pdfText.length > 5000 ? pdfText.substring(0, 5000) : pdfText;
  }
  
  // Return the combined context
  return topParagraphs.join('\n\n');
};

/**
 * Extract meaningful keywords from a question
 */
const extractKeywords = (question: string): string[] => {
  // Remove question words and common stopwords
  const stopwords = ['what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how', 
                     'does', 'did', 'do', 'is', 'are', 'was', 'were', 'am', 'be', 'being', 'been',
                     'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must',
                     'about', 'with', 'for', 'to', 'from', 'in', 'on', 'at', 'by', 'and', 'or',
                     'the', 'a', 'an', 'this', 'that', 'these', 'those', 'tell', 'explain', 'describe',
                     'provide', 'give', 'me', 'please', 'information', 'details', 'regarding'];
  
  // Clean up the question and split into words
  const words = question
    .replace(/[^\w\s]/g, '')
    .split(' ')
    .filter(word => word.length > 2) // Only words with 3+ characters
    .filter(word => !stopwords.includes(word))
    .map(word => word.toLowerCase());
  
  // Extract 2-3 word phrases that might be important
  const phrases = [];
  for (let i = 0; i < words.length - 1; i++) {
    if (!stopwords.includes(words[i]) && !stopwords.includes(words[i+1])) {
      phrases.push(`${words[i]} ${words[i+1]}`);
    }
    
    if (i < words.length - 2 && !stopwords.includes(words[i]) && 
        !stopwords.includes(words[i+1]) && !stopwords.includes(words[i+2])) {
      phrases.push(`${words[i]} ${words[i+1]} ${words[i+2]}`);
    }
  }
  
  return [...new Set([...words, ...phrases])]; // Remove duplicates
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
