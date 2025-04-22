
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
      return "I couldn't find relevant information in the document to answer your question. Please try asking something else or upload a document with more content.";
    }

    // Enhanced prompt for better context understanding and summarization
    const prompt = `<s>[INST] You are a helpful assistant that answers questions based on the provided context. 
If the question asks for more details, provide a comprehensive answer.
If asked to summarize, provide a concise summary.
If you don't know the answer, just say you don't know.

Context: ${context}

Question: ${question}

Please provide a response that:
1. Directly answers the question using information from the context
2. If asked for details, includes relevant supporting information
3. If asked to summarize, provides a clear and concise summary
4. Mentions if certain information is not available in the context [/INST]`;

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
            max_new_tokens: 500, // Increased for more detailed responses
            temperature: 0.3,
            top_p: 0.95,
            do_sample: true,
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
      return answerPart;
    }
    
    return enhancedLocalAnswering(context, question);
  } catch (error) {
    console.error("Error generating answer:", error);
    return enhancedLocalAnswering(context, question);
  }
};

/**
 * Enhanced local answering function that provides more detailed responses
 * when the AI API is unavailable
 */
const enhancedLocalAnswering = (context: string, question: string): string => {
  // Normalize the question and context to lowercase for better matching
  const questionLower = question.toLowerCase();
  const contextLower = context.toLowerCase();
  
  // Handle summarization requests
  if (questionLower.includes("summarize") || questionLower.includes("summary")) {
    return generateSummary(context);
  }
  
  // Extract paragraphs for more context
  const paragraphs = context.split(/\n\n+/).filter(p => p.trim().length > 10);
  
  // Get keywords from the question (excluding common words)
  const keywords = questionLower
    .replace(/[^\w\s]/g, '')
    .split(' ')
    .filter(word => word.length > 3 && !['what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how', 'does', 'did', 'about', 'with', 'can', 'could', 'would', 'should', 'tell', 'explain', 'describe', 'give'].includes(word));
  
  if (keywords.length === 0) {
    keywords.push(...questionLower.split(' ').filter(word => word.length > 3));
  }
  
  // Find most relevant paragraphs
  const scoredParagraphs = paragraphs.map(paragraph => {
    const paragraphLower = paragraph.toLowerCase();
    let score = 0;
    
    keywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      const matches = paragraphLower.match(regex);
      if (matches) {
        score += matches.length * 2;
      }
    });
    
    // Boost score for paragraphs that contain exact phrases from the question
    const phrases = extractPhrases(questionLower);
    phrases.forEach(phrase => {
      if (paragraphLower.includes(phrase)) {
        score += phrase.split(' ').length * 3;
      }
    });
    
    return { paragraph, score };
  });
  
  // Sort paragraphs by relevance
  const relevantParagraphs = scoredParagraphs
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .filter(item => item.score > 0)
    .map(item => item.paragraph);
  
  if (relevantParagraphs.length === 0) {
    return "I couldn't find specific information about that in the document. The document doesn't appear to contain content related to your question. Could you try rephrasing your question or asking about something else mentioned in the document?";
  }
  
  // Construct a more detailed answer
  let answer = "Based on the document, I found the following information:\n\n";
  
  relevantParagraphs.forEach((paragraph, index) => {
    answer += `${paragraph}\n\n`;
  });
  
  // Add a conclusion if multiple paragraphs were found
  if (relevantParagraphs.length > 1) {
    answer += "These sections from the document appear most relevant to your question. If you need more specific information, please try asking a more focused question.";
  }
  
  return answer;
};

/**
 * Generate a summary of the provided content
 */
const generateSummary = (context: string): string => {
  // If context is too short, return it as is
  if (context.length < 500) {
    return `Summary of the document: ${context}`;
  }
  
  // Extract paragraphs and select the most important ones
  const paragraphs = context.split(/\n\n+/).filter(p => p.trim().length > 10);
  
  if (paragraphs.length <= 3) {
    return `Summary of the document: ${paragraphs.join("\n\n")}`;
  }
  
  // Take first paragraph (often contains introduction)
  const introduction = paragraphs[0];
  
  // Take a middle paragraph (often contains key information)
  const middleIndex = Math.floor(paragraphs.length / 2);
  const middleParagraph = paragraphs[middleIndex];
  
  // Take last paragraph (often contains conclusion)
  const conclusion = paragraphs[paragraphs.length - 1];
  
  return `Summary of the document:

${introduction}

${middleParagraph}

${conclusion}

This summary includes the introduction, key content, and conclusion from the document. The full document contains more details.`;
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

