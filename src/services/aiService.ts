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
      return "I couldn't find relevant information in the document to answer your question.";
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
      console.warn("AI API unavailable, using fallback mechanism");
      return simplifiedAnswering(context, question);
    }

    const result = await response.json();
    
    if (Array.isArray(result) && result.length > 0 && result[0].generated_text) {
      const fullResponse = result[0].generated_text;
      const answerPart = fullResponse.split("[/INST]")[1]?.trim() || fullResponse;
      return answerPart;
    }
    
    return simplifiedAnswering(context, question);
  } catch (error) {
    console.error("Error generating answer:", error);
    return simplifiedAnswering(context, question);
  }
};

/**
 * Simplified answering function for when the AI API is unavailable
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
