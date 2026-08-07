const { GoogleGenerativeAI } = require('@google/generative-ai');

// Check if Gemini API key is configured
const isGeminiEnabled = () => {
  return !!process.env.GEMINI_API_KEY;
};



// Initialize Gemini SDK
let genAI;
if (isGeminiEnabled()) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// @desc    Check if two question texts are too similar (basic deduplication)
// @param   newQuestion: String, previousList: Array of strings
function isTooSimilar(newQuestion, previousList) {
  if (!newQuestion || previousList.length === 0) return false;
  // Normalize: lowercase, strip punctuation and extra spaces
  const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  const normalizedNew = normalize(newQuestion);

  for (const prev of previousList) {
    const normalizedPrev = normalize(prev);
    // Check if they share more than 70% of words (sliding window approach)
    const newWords = new Set(normalizedNew.split(' '));
    const prevWords = normalizedPrev.split(' ');
    const commonWords = prevWords.filter(w => newWords.has(w) && w.length > 3);
    const similarity = commonWords.length / Math.max(newWords.size, prevWords.length);
    if (similarity > 0.7) {
      console.warn(`[AI SERVICE] Duplicate detected (similarity: ${(similarity * 100).toFixed(0)}%). Retrying...`);
      return true;
    }
  }
  return false;
}

// @desc    Generate a single aptitude question using Gemini
// @param   level: String, previousQuestionsList: Array of strings
exports.generateAIQuestion = async (level, previousQuestionsList = []) => {
  if (!isGeminiEnabled()) {
    throw new Error('Gemini API key is not configured. Online mode only is enabled.');
  }

  const MAX_RETRIES = 3;

  const schema = {
    type: 'object',
    properties: {
      questionText: { type: 'string', description: 'The text of the aptitude question.' },
      options: {
        type: 'object',
        properties: {
          A: { type: 'string' },
          B: { type: 'string' },
          C: { type: 'string' },
          D: { type: 'string' }
        },
        required: ['A', 'B', 'C', 'D']
      },
      correctOption: { type: 'string', enum: ['A', 'B', 'C', 'D'], description: 'The correct choice.' },
      explanation: { type: 'string', description: 'Detailed, step-by-step mathematical or logical explanation.' },
      topic: { type: 'string', description: 'The specific sub-topic (e.g. Percentages, Time & Work, Calendars).' }
    },
    required: ['questionText', 'options', 'correctOption', 'explanation', 'topic']
  };

  // Extract already-used topics so the AI avoids repeating them if possible
  // (For the quiz controller, previousQuestionsList is an array of question text strings,
  //  so we also accept an array of objects for richer context)
  const isObjectList = previousQuestionsList.length > 0 && typeof previousQuestionsList[0] === 'object';
  const questionTexts = isObjectList
    ? previousQuestionsList.map(q => q.questionText)
    : previousQuestionsList;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      // Build a strongly-worded anti-duplication context
      let previousQuestionsContext;
      if (questionTexts.length === 0) {
        previousQuestionsContext = 'This is the FIRST question in the quiz session.';
      } else {
        previousQuestionsContext = [
          `ALREADY ASKED QUESTIONS (${questionTexts.length} total) — You MUST NOT repeat or rephrase ANY of these:`,
          ...questionTexts.map((q, idx) => `  ${idx + 1}. "${q}"`)
        ].join('\n');
      }

      // On retries, explicitly ask for a completely different topic
      const retryNote = attempt > 1
        ? `IMPORTANT: Your previous attempt was rejected for being too similar. Attempt #${attempt}: Pick a COMPLETELY DIFFERENT topic and scenario from ALL previous questions.`
        : '';

      const systemPrompt = `You are an AI Aptitude Quiz Agent. Generate ONE unique, original aptitude question for difficulty level: "${level}".

## DIFFICULTY TOPICS:
- Basic: Arithmetic, Percentages, Ratio, Profit & Loss, Average, Simple Interest, Time & Work, Number Series, Alphabet Series, Basic Reasoning
- Intermediate: Probability, Compound Interest, Data Interpretation, Coding-Decoding, Blood Relations, Clocks, Calendars, Syllogism, Seating Arrangement
- Advance: Advanced Aptitude, Critical Reasoning, Data Sufficiency, Puzzles, Statement & Assumption, Caselet DI, Number Theory
- Company Related: TCS, Infosys, Wipro, Accenture, Cognizant, Capgemini, Deloitte, IBM, HCL placement test questions
- Government Exams: SSC CGL, UPSC CSAT, Banking PO, SBI Clerk, IBPS, RRB, TNPSC, Railway RRB questions

## STRICT UNIQUENESS RULES (MANDATORY):
${previousQuestionsContext}

- The question scenario, numbers, and topic MUST be different from ALL previous questions above.
- Do NOT reuse the same formula, variable names, or context (e.g., don't generate two train/speed problems or two percentage problems in a row if one was already asked).
- The question must have exactly ONE indisputable correct answer.
- All 4 options (A, B, C, D) must contain plausible numerical or logical distractors.
- Provide a detailed, step-by-step explanation in the "explanation" field.
${retryNote}`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 1.0  // Higher temperature = more varied, less repetitive output
        }
      });

      const responseText = result.response.text();
      const question = JSON.parse(responseText);

      // Post-generation deduplication check
      if (isTooSimilar(question.questionText, questionTexts)) {
        console.warn(`[AI SERVICE] Attempt ${attempt}/${MAX_RETRIES}: Question too similar, retrying...`);
        if (attempt === MAX_RETRIES) {
          throw new Error('All question generation retries exhausted due to high similarity/duplicates.');
        }
        continue; // Try again
      }

      console.log(`[AI SERVICE] Generated unique question on attempt ${attempt}: "${question.topic}"`);
      return question;

    } catch (error) {
      console.error(`[AI SERVICE] Gemini Question Generation Error (attempt ${attempt}):`, error.message);
      if (attempt === MAX_RETRIES) {
        throw error;
      }
    }
  }

  // Should never reach here
  throw new Error('Failed to generate question: Max retries exceeded or unexpected execution path.');
};

// @desc    Generate a contextual hint for a quiz question using Gemini
// @param   questionText: String, options: Object {A,B,C,D}, hintNumber: 1|2|3
exports.generateHint = async (questionText, options, hintNumber = 1) => {
  const fallbackHints = [
    'Try eliminating the most obviously wrong answer first, then compare the remaining options.',
    'Focus on the key numbers or relationships in the question. Try working backwards from the options.',
    'Identify the formula or concept being tested. Substitute options into the question to verify.'
  ];

  if (!isGeminiEnabled()) {
    throw new Error('Gemini API key is not configured. Hint generation requires online mode.');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const hintDirectiveness = {
      1: 'a subtle conceptual nudge — mention the topic/concept involved without any numbers or direction',
      2: 'a moderate hint — describe the approach or method to use, without revealing the answer',
      3: 'a strong hint — walk through the first step of the solution process clearly'
    };

    const promptText = `You are a quiz assistant. A student needs a hint for this aptitude question.

Question: ${questionText}
Options:
A) ${options.A}
B) ${options.B}
C) ${options.C}
D) ${options.D}

This is hint #${hintNumber}. Provide ${hintDirectiveness[hintNumber] || hintDirectiveness[1]}.

IMPORTANT RULES:
- Do NOT reveal or directly state the correct answer or its option letter.
- Keep the hint concise (2-3 sentences max).
- Be helpful but leave the final answer for the student to determine.`;

    const schema = {
      type: 'object',
      properties: {
        hint: {
          type: 'string',
          description: 'The hint text for the student.'
        }
      },
      required: ['hint']
    };

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.4
      }
    });

    const responseText = result.response.text();
    return JSON.parse(responseText);

  } catch (error) {
    console.error('[AI SERVICE] Gemini Hint Generation Error:', error.message);
    throw error;
  }
};


// @desc    Perform overall user performance analysis
// @param   quizData: Object containing quiz stats, answers, and questions
exports.analyzePerformance = async (quizData) => {
  const { level, score, totalQuestions, questions, answers } = quizData;

  if (!isGeminiEnabled()) {
    throw new Error('Gemini API key is not configured. Performance analysis requires online mode.');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const schema = {
      type: 'object',
      properties: {
        strongTopics: {
          type: 'array',
          items: { type: 'string' },
          description: 'A list of 2-3 topics where the user performed well.'
        },
        weakTopics: {
          type: 'array',
          items: { type: 'string' },
          description: 'A list of 2-3 topics where the user made mistakes.'
        },
        learningSuggestions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific actionable learning tasks or resources to improve.'
        },
        difficultyAnalysis: {
          type: 'string',
          description: 'A brief evaluation of the user\'s performance at this level.'
        },
        recommendedNextLevel: {
          type: 'string',
          enum: ['Basic', 'Intermediate', 'Advance', 'Company Related', 'Government Exams'],
          description: 'The next recommended difficulty level.'
        }
      },
      required: ['strongTopics', 'weakTopics', 'learningSuggestions', 'difficultyAnalysis', 'recommendedNextLevel']
    };

    // Construct mapping of questions, topics and if user was correct
    const performanceSummary = questions.map((q, idx) => {
      const isCorrect = q.correctOption === answers[idx];
      return {
        topic: q.topic,
        question: q.questionText,
        userAnswer: answers[idx],
        correctAnswer: q.correctOption,
        status: isCorrect ? 'Correct' : 'Incorrect'
      };
    });

    const promptText = `Analyze the user's performance in a ${level} level aptitude quiz.
    
Here are the quiz details:
- Level: ${level}
- Score: ${score}/${totalQuestions}
- Performance breakdown:
${JSON.stringify(performanceSummary, null, 2)}

Please generate:
1. List of Strong Topics
2. List of Weak Topics / Areas of Improvement
3. Actionable learning suggestions to improve speed or accuracy
4. Overall feedback evaluating their performance (e.g. speed, concepts, common pitfalls)
5. Recommended next level (Must be one of: 'Basic', 'Intermediate', 'Advance', 'Company Related', 'Government Exams')`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.5
      }
    });

    const responseText = result.response.text();
    return JSON.parse(responseText);

  } catch (error) {
    console.error('[AI SERVICE] Gemini Analysis Error:', error.message);
    throw error;
  }
};


