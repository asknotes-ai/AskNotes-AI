/**
 * Service for interacting with Hugging Face Inference API to answer questions
 */

/**
 * Answers a question based on provided context using a language model
 * @param context The context from the PDF to base the answer on
 * @param question The user's question
 * @returns A promise that resolves to the model's answer
 */
export const generateAnswer = async (
  context: string,
  question: string
): Promise<string> => {
  try {
    if (!context || context.trim() === '') {
      return "I don't see any content to work with in the document yet. Could you try uploading a document first? I'd love to help answer your questions! 🤗";
    }

    // Enhanced prompt for more friendly and detailed responses
    const prompt = `<s>[INST] You are a friendly and knowledgeable assistant who loves to help people understand documents. 
Your responses should be:
- Warm and engaging, using a friendly tone
- Well-structured with bullet points or sections when appropriate
- Detailed but clear, avoiding jargon unless necessary
- Adding emoji occasionally to keep things light (but not too many!)

Context from the document: ${context}

Question: ${question}

Please provide a helpful response that:
1. Starts with a friendly greeting or acknowledgment
2. Directly addresses the question using information from the context
3. Adds relevant examples or explanations when helpful
4. Organizes information in an easy-to-read format
5. Ends with an invitation for follow-up questions if needed [/INST]`;

    const response = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 800, // Increased for more detailed responses
            temperature: 0.4, // Slightly reduced for more focused responses
            top_p: 0.95,
            do_sample: true,
            repetition_penalty: 1.15, // Added to reduce repetitive phrases
          },
        }),
      }
    );

    if (!response.ok) {
      console.warn("AI API unavailable, using enhanced local answering");
      return enhancedLocalAnswering(context, question);
    }

    const result = await response.json();
    
    if (Array.isArray(result) && result.length > 0 && result[0].generated_text) {
      const fullResponse = result[0].generated_text;
      const answerPart = fullResponse.split("[/INST]")[1]?.trim() || fullResponse;
      return formatResponse(answerPart);
    }
    
    return enhancedLocalAnswering(context, question);
  } catch (error) {
    console.error("Error generating answer:", error);
    return enhancedLocalAnswering(context, question);
  }
};

// New helper function to format responses nicely
const formatResponse = (response: string): string => {
  // Add emoji based on content type
  let formattedResponse = response;
  
  // Add emoji for different types of responses
  if (response.toLowerCase().includes('summary')) {
    formattedResponse = "📑 " + formattedResponse;
  } else if (response.toLowerCase().includes('example')) {
    formattedResponse = "💡 " + formattedResponse;
  } else if (response.toLowerCase().includes('important')) {
    formattedResponse = "⭐ " + formattedResponse;
  } else {
    formattedResponse = "🤓 " + formattedResponse;
  }
  
  // Add a friendly closing if it doesn't already have one
  if (!formattedResponse.toLowerCase().includes('let me know') && 
      !formattedResponse.toLowerCase().includes('feel free')) {
    formattedResponse += "\n\n✨ Feel free to ask if you need any clarification!";
  }
  
  return formattedResponse;
};

// Enhanced local answering function for when API is unavailable
const enhancedLocalAnswering = (context: string, question: string): string => {
  const questionType = identifyQuestionType(question);
  const relevantContext = findRelevantContext(context, question);
  
  let response = "👋 Here's what I found in the document:\n\n";
  
  if (questionType === 'summary') {
    response = "📚 Here's a friendly summary:\n\n" + generateSummary(relevantContext);
  } else if (questionType === 'specific') {
    response = "🔍 I found this specific information:\n\n" + relevantContext;
  } else {
    response = "💡 Based on the document:\n\n" + relevantContext;
  }
  
  return response + "\n\n✨ Let me know if you'd like to know more!";
};

// Helper function to identify question type
const identifyQuestionType = (question: string): 'summary' | 'specific' | 'general' => {
  const questionLower = question.toLowerCase();
  if (questionLower.includes('summarize') || questionLower.includes('summary')) {
    return 'summary';
  }
  if (questionLower.includes('what') || questionLower.includes('when') || 
      questionLower.includes('where') || questionLower.includes('who') ||
      questionLower.includes('how') || questionLower.includes('why')) {
    return 'specific';
  }
  return 'general';
};

// Helper function to generate a friendly summary
const generateSummary = (context: string): string => {
  const paragraphs = context.split('\n\n').filter(p => p.trim().length > 0);
  
  if (paragraphs.length <= 1) {
    return context;
  }
  
  return `${paragraphs[0]}\n\n🔑 Key points:\n${
    paragraphs.slice(1).map(p => `• ${p.trim()}`).join('\n')
  }`;
};

/**
 * Find relevant context from PDF text based on user's question
 * @param pdfText The full PDF text
 * @param question The user's question
 * @returns Relevant context from the PDF
 */
const findRelevantContext = (pdfText: string, question: string): string => {
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
 * Extract meaningful phrases from a question
 */
const extractPhrases = (question: string): string[] => {
  // Remove question words and common words at the beginning
  const cleanedQuestion = question
    .replace(/^(what|when|where|which|who|whom|whose|why|how|does|did|can|could|would|should|tell me about|explain|describe) /i, '')
    .replace(/[^\w\s]/g, '');
    
  // Extract 2-3 word phrases
  const words = cleanedQuestion.split(' ').filter(word => word.length > 2);
  const phrases = [];
  
  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(`${words[i]} ${words[i + 1]}`);
    if (i < words.length - 2) {
      phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
    }
  }
  
  return [...phrases, cleanedQuestion];
};

/**
 * Simplified answering function for when the AI API is unavailable
 * @deprecated Use enhancedLocalAnswering instead
 */
const simplifiedAnswering = (context: string, question: string): string => {
  const questionLower = question.toLowerCase();
  const contextLower = context.toLowerCase();
  
  // Find relevant sentences from the context
  const sentences = context.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Get keywords from the question
  const keywords = questionLower
    .replace(/[^\w\s]/g, '')
    .split(' ')
    .filter(word => word.length > 3 && !['what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how', 'does', 'did', 'about', 'with'].includes(word));
  
  // Find most relevant sentence
  const mostRelevantSentence = sentences.reduce(
    (best, current) => {
      const currentLower = current.toLowerCase();
      let score = 0;
      
      keywords.forEach(keyword => {
        if (currentLower.includes(keyword)) {
          score += 1;
        }
      });
      
      return score > best.score ? { sentence: current, score } : best;
    },
    { sentence: "", score: 0 }
  );
  
  if (mostRelevantSentence.score === 0) {
    return "I couldn't find specific information about that in the document. Could you try rephrasing your question?";
  }
  
  return `Based on the document: ${mostRelevantSentence.sentence}`;
};
