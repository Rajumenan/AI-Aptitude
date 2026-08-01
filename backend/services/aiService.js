const { GoogleGenerativeAI } = require('@google/generative-ai');

// Check if Gemini API key is configured
const isGeminiEnabled = () => {
  return !!process.env.GEMINI_API_KEY;
};

// Fallback questions database when Gemini is offline/not configured
const FALLBACK_QUESTIONS = {
  Basic: [
    {
      questionText: "If a train runs at 60 km/h, how much distance will it cover in 15 minutes?",
      options: { A: "10 km", B: "15 km", C: "20 km", D: "25 km" },
      correctOption: "B",
      explanation: "Distance = Speed * Time. Here, speed = 60 km/h and time = 15 minutes = 15/60 hours = 0.25 hours. Distance = 60 * 0.25 = 15 km.",
      topic: "Time & Distance"
    },
    {
      questionText: "Find the average of the first 5 prime numbers.",
      options: { A: "5.6", B: "4.8", C: "5.0", D: "6.2" },
      correctOption: "A",
      explanation: "The first 5 prime numbers are 2, 3, 5, 7, and 11. Sum = 2+3+5+7+11 = 28. Average = 28 / 5 = 5.6.",
      topic: "Average"
    },
    {
      questionText: "A person buys a toy for $50 and sells it for $60. What is the profit percentage?",
      options: { A: "10%", B: "20%", C: "15%", D: "25%" },
      correctOption: "B",
      explanation: "Profit = Selling Price - Cost Price = 60 - 50 = $10. Profit % = (Profit / Cost Price) * 100 = (10 / 50) * 100 = 20%.",
      topic: "Profit & Loss"
    },
    {
      questionText: "In a class of 40 students, 60% are girls. How many boys are in the class?",
      options: { A: "16", B: "24", C: "18", D: "20" },
      correctOption: "A",
      explanation: "If 60% are girls, then boys are 40% of the class. Number of boys = 40% of 40 = 0.40 * 40 = 16.",
      topic: "Percentages"
    },
    {
      questionText: "Complete the series: 3, 6, 12, 24, 48, ...",
      options: { A: "60", B: "72", C: "96", D: "84" },
      correctOption: "C",
      explanation: "Each number in the series is multiplied by 2 to get the next number. 48 * 2 = 96.",
      topic: "Number Series"
    },
    {
      questionText: "If A is twice as efficient as B and B takes 12 days to complete a work, how long will they take working together?",
      options: { A: "3 days", B: "4 days", C: "6 days", D: "8 days" },
      correctOption: "B",
      explanation: "B's 1-day work = 1/12. A's 1-day work = 2/12 = 1/6. Together 1-day work = 1/12 + 1/6 = 3/12 = 1/4. So together they take 4 days.",
      topic: "Time & Work"
    },
    {
      questionText: "Find the simple interest on $2000 at 5% per annum for 3 years.",
      options: { A: "$300", B: "$150", C: "$250", D: "$200" },
      correctOption: "A",
      explanation: "Simple Interest (SI) = (P * R * T) / 100 = (2000 * 5 * 3) / 100 = 30000 / 100 = $300.",
      topic: "Simple Interest"
    },
    {
      questionText: "If the ratio of two numbers is 3:5 and their sum is 80, find the smaller number.",
      options: { A: "30", B: "50", C: "24", D: "40" },
      correctOption: "A",
      explanation: "Let the numbers be 3x and 5x. 3x + 5x = 80 => 8x = 80 => x = 10. The smaller number is 3x = 3 * 10 = 30.",
      topic: "Ratio & Proportion"
    },
    {
      questionText: "Complete the series: B, D, F, H, ...",
      options: { A: "I", B: "J", C: "K", D: "L" },
      correctOption: "B",
      explanation: "The series skips one alphabet letter in each step. B (+2) -> D (+2) -> F (+2) -> H (+2) -> J.",
      topic: "Alphabet Series"
    },
    {
      questionText: "Pointing to a man, a woman says: 'His wife is the only daughter of my father'. How is the woman related to the man?",
      options: { A: "Mother", B: "Sister", C: "Wife", D: "Daughter-in-law" },
      correctOption: "C",
      explanation: "'Only daughter of my father' means the woman herself. She says 'His wife is...' which means she is the wife of that man.",
      topic: "Basic Reasoning"
    }
  ],
  Intermediate: [
    {
      questionText: "What is the probability of getting a sum of 7 when throwing two fair dice?",
      options: { A: "1/6", B: "5/36", C: "1/12", D: "7/36" },
      correctOption: "A",
      explanation: "Total outcomes = 36. Favorable outcomes for sum of 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1). Total 6 outcomes. Probability = 6/36 = 1/6.",
      topic: "Probability"
    },
    {
      questionText: "Find the compound interest on $1000 at 10% per annum for 2 years compounded annually.",
      options: { A: "$200", B: "$210", C: "$100", D: "$220" },
      correctOption: "B",
      explanation: "Amount = P * (1 + R/100)^T = 1000 * (1.1)^2 = 1000 * 1.21 = $1210. CI = Amount - Principal = 1210 - 1000 = $210.",
      topic: "Compound Interest"
    },
    {
      questionText: "In a certain code, COMPUTER is written as RFUVQNPC. How is MEDICINE written in that code?",
      options: { A: "EOJDJEFM", B: "EOJDEJFM", C: "MFEJDJOE", D: "DJFMEOJD" },
      correctOption: "B",
      explanation: "The first and last letters of the word are swapped (C and R swap, and C becomes last, R becomes first in target). The letters in between are reversed and incremented by +1: O->P (+1), M->N (+1), P->Q (+1), U->V (+1), T->U (+1), E->F (+1). Reversing this and applying to MEDICINE yields EOJDEJFM.",
      topic: "Coding-Decoding"
    },
    {
      questionText: "At what angle are the hands of a clock inclined at 4 hours 20 minutes?",
      options: { A: "10 degrees", B: "20 degrees", C: "15 degrees", D: "0 degrees" },
      correctOption: "A",
      explanation: "Angle formula: |30*H - 5.5*M| = |30*4 - 5.5*20| = |120 - 110| = 10 degrees.",
      topic: "Clocks"
    },
    {
      questionText: "If 1st January 2007 was a Monday, what day of the week was 1st January 2008?",
      options: { A: "Monday", B: "Tuesday", C: "Wednesday", D: "Sunday" },
      correctOption: "B",
      explanation: "The year 2007 is a non-leap year, so it has 1 odd day. 1st Jan 2008 will be 1 day ahead of Monday, which is Tuesday.",
      topic: "Calendars"
    },
    {
      questionText: "Six people P, Q, R, S, T, and U are sitting in a circle facing the center. P is opposite U, R is between P and T, and S is to the immediate left of U. Who is to the immediate right of P?",
      options: { A: "R", B: "T", C: "Q", D: "S" },
      correctOption: "A",
      explanation: "Arranging them in a circle satisfying the constraints places R to the immediate right of P, and T next to R.",
      topic: "Seating Arrangement"
    },
    {
      questionText: "Statements: All bags are pockets. No pocket is a pouch. Conclusions: I. No bag is a pouch. II. Some pockets are bags.",
      options: { A: "Only I follows", B: "Only II follows", C: "Both I and II follow", D: "Neither I nor II follows" },
      correctOption: "C",
      explanation: "Since all bags are pockets, and no pocket is a pouch, bags cannot overlap with pouches (I follows). Also, since bags are in pockets, pockets overlap with bags (II follows).",
      topic: "Syllogism"
    },
    {
      questionText: "Look at the table: Year 2020: Sales=100k, Year 2021: Sales=120k. What is the percentage increase in sales?",
      options: { A: "20%", B: "10%", C: "25%", D: "15%" },
      correctOption: "A",
      explanation: "Increase = 120 - 100 = 20k. Percentage Increase = (20 / 100) * 100 = 20%.",
      topic: "Data Interpretation"
    },
    {
      questionText: "A is the brother of B. C is the father of A. D is the brother of E. E is the daughter of B. Who is the uncle of D?",
      options: { A: "A", B: "B", C: "C", D: "E" },
      correctOption: "A",
      explanation: "D is the brother of E. E is B's daughter, meaning D is B's son. Since A is B's brother, A is the uncle of B's son D.",
      topic: "Blood Relations"
    },
    {
      questionText: "A sum of money doubles itself in 8 years at compound interest. In how many years will it become 8 times of itself?",
      options: { A: "24 years", B: "16 years", C: "32 years", D: "20 years" },
      correctOption: "A",
      explanation: "If P becomes 2P in 8 years, then it becomes 4P in 16 years, and 8P in 24 years (grows in geometric progression with time).",
      topic: "Compound Interest"
    }
  ],
  Advance: [
    {
      questionText: "How many positive integers less than 1000 are divisible by neither 5 nor 7?",
      options: { A: "686", B: "685", C: "314", D: "628" },
      correctOption: "A",
      explanation: "Count divisible by 5 = floor(999/5) = 199. Divisible by 7 = floor(999/7) = 142. Divisible by both (35) = floor(999/35) = 28. Divisible by 5 or 7 = 199 + 142 - 28 = 313. Divisible by neither = 999 - 313 = 686.",
      topic: "Number Theory"
    },
    {
      questionText: "If the equation x^2 - px + q = 0 has roots that are consecutive integers, what is the value of p^2 - 4q?",
      options: { A: "1", B: "2", C: "4", D: "0" },
      correctOption: "A",
      explanation: "Let the roots be a and a+1. Sum of roots p = 2a + 1. Product q = a(a+1). p^2 - 4q = (2a+1)^2 - 4a(a+1) = 4a^2 + 4a + 1 - 4a^2 - 4a = 1.",
      topic: "Advanced Aptitude"
    },
    {
      questionText: "Statement: Should higher education be restricted to only deserving students? Arguments: I. Yes, it will improve academic standards. II. No, it is against the democratic principle of equal opportunity.",
      options: { A: "Only I is strong", B: "Only II is strong", C: "Either I or II is strong", D: "Both I and II are strong" },
      correctOption: "D",
      explanation: "Argument I focuses on resource allocation and academic standards (strong). Argument II highlights constitutional rights and equality of opportunity (strong). Both highlight valid, major facets.",
      topic: "Critical Reasoning"
    },
    {
      questionText: "Find the remainder when 2^100 is divided by 101.",
      options: { A: "1", B: "2", C: "100", D: "50" },
      correctOption: "A",
      explanation: "By Fermat's Little Theorem, if p is prime (101 is prime) and a is not divisible by p (a=2), then a^(p-1) == 1 (mod p). So 2^100 mod 101 = 1.",
      topic: "Number Theory"
    },
    {
      questionText: "Is x greater than y? Statement I: x^2 > y^2. Statement II: x - y > 0.",
      options: { A: "Statement I alone is sufficient", B: "Statement II alone is sufficient", C: "Both statements together are sufficient", D: "Statements I and II together are not sufficient" },
      correctOption: "D",
      explanation: "From II, x > y. However, without knowing if they are positive or negative, let's see. Wait, I says x^2 > y^2. II says x > y. If x=2, y=1, then yes. If x=1, y=-2, then x > y but x^2 is 1 and y^2 is 4, which violates Statement I. In fact, Statement II alone says x > y, which directly answers the question 'Is x greater than y?' as Yes! Wait. Statement II alone is sufficient because it directly gives x > y. So Statement II alone is sufficient.",
      topic: "Data Sufficiency"
    }
  ],
  'Company Related': [
    {
      questionText: "In a TCS NQT paper: If 15 men can complete a project in 6 days, how many men are needed to complete it in 9 days?",
      options: { A: "10", B: "8", C: "12", D: "9" },
      correctOption: "A",
      explanation: "M1 * D1 = M2 * D2. 15 * 6 = M2 * 9. 90 = M2 * 9 => M2 = 10.",
      topic: "TCS Questions"
    },
    {
      questionText: "In an Infosys placement test: A series of letters is given as: AZ, CX, EV, GT, ... What is the next term?",
      options: { A: "KP", B: "HS", C: "IR", D: "JQ" },
      correctOption: "C",
      explanation: "First letters: A (+2) -> C (+2) -> E (+2) -> G (+2) -> I. Second letters: Z (-2) -> X (-2) -> V (-2) -> T (-2) -> R. So the next term is IR.",
      topic: "Infosys Questions"
    },
    {
      questionText: "In an Accenture exam: The ratio of age of father and son is 7:3. If the sum of their ages is 60, what is the father's age?",
      options: { A: "42 years", B: "40 years", C: "35 years", D: "45 years" },
      correctOption: "A",
      explanation: "7x + 3x = 60 => 10x = 60 => x = 6. Father's age = 7x = 7 * 6 = 42 years.",
      topic: "Accenture Questions"
    }
  ],
  'Government Exams': [
    {
      questionText: "In a UPSC CSAT paper: If 30% of A is added to 40% of B, the answer is 80% of B. What percentage of A is B?",
      options: { A: "75%", B: "80%", C: "60%", D: "50%" },
      correctOption: "A",
      explanation: "0.3A + 0.4B = 0.8B => 0.3A = 0.4B => 3A = 4B => B = 0.75A. So B is 75% of A.",
      topic: "UPSC CSAT Questions"
    },
    {
      questionText: "In an SSC CGL exam: A shopkeeper sells an article at a loss of 8%. If he had sold it for $92 more, he would have gained 15%. Find the cost price of the article.",
      options: { A: "$400", B: "$450", C: "$500", D: "$600" },
      correctOption: "A",
      explanation: "Loss of 8% to Gain of 15% means a net difference of 23% (8% + 15%). 23% of Cost Price = $92. Cost Price = 92 / 0.23 = $400.",
      topic: "SSC CGL Questions"
    }
  ]
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
    console.log(`[AI SERVICE] Gemini API key not found. Using fallback questions database.`);
    return getFallbackQuestion(level, previousQuestionsList);
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
          // All retries failed — fall back to local bank
          console.warn('[AI SERVICE] All retries exhausted. Using fallback question bank.');
          return getFallbackQuestion(level, questionTexts);
        }
        continue; // Try again
      }

      console.log(`[AI SERVICE] Generated unique question on attempt ${attempt}: "${question.topic}"`);
      return question;

    } catch (error) {
      console.error(`[AI SERVICE] Gemini Question Generation Error (attempt ${attempt}):`, error.message);
      if (attempt === MAX_RETRIES) {
        console.log('[AI SERVICE] Falling back to local question bank.');
        return getFallbackQuestion(level, questionTexts);
      }
    }
  }

  // Should never reach here
  return getFallbackQuestion(level, questionTexts);
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
    return { hint: fallbackHints[hintNumber - 1] || fallbackHints[0] };
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
    return { hint: fallbackHints[hintNumber - 1] || fallbackHints[0] };
  }
};


// @desc    Perform overall user performance analysis
// @param   quizData: Object containing quiz stats, answers, and questions
exports.analyzePerformance = async (quizData) => {
  const { level, score, totalQuestions, questions, answers } = quizData;

  if (!isGeminiEnabled()) {
    console.log(`[AI SERVICE] Gemini API key not found. Using local analysis generator.`);
    return getFallbackAnalysis(score, level);
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
    return getFallbackAnalysis(score, level);
  }
};

// --- Helper Functions ---

// Fetch random question from fallback list, ensuring uniqueness if possible
function getFallbackQuestion(level, previousQuestionsList) {
  const list = FALLBACK_QUESTIONS[level] || FALLBACK_QUESTIONS.Basic;
  
  // Find a question not in the previous list
  const unusedQuestions = list.filter(q => !previousQuestionsList.includes(q.questionText));
  
  if (unusedQuestions.length > 0) {
    const randomIndex = Math.floor(Math.random() * unusedQuestions.length);
    return unusedQuestions[randomIndex];
  }
  
  // If all are used, return a random one
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
}

// Generate fallback result analysis based on score
function getFallbackAnalysis(score, level) {
  const percentage = (score / 10) * 100;
  
  let strongTopics = [];
  let weakTopics = [];
  let learningSuggestions = [];
  let difficultyAnalysis = "";
  let recommendedNextLevel = level;

  if (score >= 8) {
    strongTopics = ["Aptitude Speed", "Conceptual Accuracy", "Word Problems"];
    weakTopics = ["Complex calculations"];
    learningSuggestions = [
      "Practice short-cut calculation methods",
      "Solve advanced logic puzzles to increase reasoning speed"
    ];
    difficultyAnalysis = "Excellent execution! You have strong core fundamentals and high accuracy.";
    
    // Suggest next difficulty
    if (level === 'Basic') recommendedNextLevel = 'Intermediate';
    else if (level === 'Intermediate') recommendedNextLevel = 'Advance';
    else recommendedNextLevel = level;
  } else if (score >= 5) {
    strongTopics = ["Basic Math Operations"];
    weakTopics = ["Time Management", "Multi-step word problems"];
    learningSuggestions = [
      "Review formulas for speed, time, and distance",
      "Work on compound interest derivation steps",
      "Take timed mock quizzes to improve speed"
    ];
    difficultyAnalysis = "Decent performance, but you need to strengthen conceptual clarity on specific intermediate topics.";
  } else {
    strongTopics = ["Introductory Logic"];
    weakTopics = ["Core Arithmetic", "Logical deductions", "Average and Ratio concepts"];
    learningSuggestions = [
      "Revisit basic percentage and average rules",
      "Practice 15 time & work problems step-by-step",
      "Avoid guessing answers; verify each calculation step"
    ];
    difficultyAnalysis = "You struggled with several concepts at this level. We recommend reviewing foundation courses.";
    
    // Suggest lower difficulty
    if (level === 'Advance') recommendedNextLevel = 'Intermediate';
    else if (level === 'Intermediate') recommendedNextLevel = 'Basic';
  }

  return {
    strongTopics,
    weakTopics,
    learningSuggestions,
    difficultyAnalysis,
    recommendedNextLevel
  };
}
