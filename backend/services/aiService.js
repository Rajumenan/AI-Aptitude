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
    console.warn('[AI SERVICE] Gemini API key not found. Using dynamic mock generator.');
    return generateDynamicMockQuestion(level, previousQuestionsList);
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
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
          console.warn('[AI SERVICE] All retries exhausted. Using dynamic mock generator.');
          return generateDynamicMockQuestion(level, previousQuestionsList);
        }
        continue; // Try again
      }

      console.log(`[AI SERVICE] Generated unique question on attempt ${attempt}: "${question.topic}"`);
      return question;

    } catch (error) {
      console.error(`[AI SERVICE] Gemini Question Generation Error (attempt ${attempt}):`, error.message);
      if (attempt === MAX_RETRIES) {
        console.warn('[AI SERVICE] Gemini API failed. Using dynamic mock generator.');
        return generateDynamicMockQuestion(level, previousQuestionsList);
      }
    }
  }

  // Should never reach here
  return generateDynamicMockQuestion(level, previousQuestionsList);
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
    console.warn('[AI SERVICE] Gemini API key not found. Using mock hint.');
    return generateMockHint(questionText, options, hintNumber);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
    return generateMockHint(questionText, options, hintNumber);
  }
};


// @desc    Perform overall user performance analysis
// @param   quizData: Object containing quiz stats, answers, and questions
exports.analyzePerformance = async (quizData) => {
  const { level, score, totalQuestions, questions, answers } = quizData;

  if (!isGeminiEnabled()) {
    console.warn('[AI SERVICE] Gemini API key not found. Using mock performance analysis.');
    return generateMockAnalysis(score, level);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
    return generateMockAnalysis(score, level);
  }
};

// --- Programmatic Mock Generators (No Stored Database Questions) ---

// @desc    Dynamically generate a question programmatically
function generateDynamicMockQuestion(level, previousQuestionsList) {
  const topics = {
    Basic: ['Percentages', 'Profit & Loss', 'Average', 'Ratio', 'Simple Interest'],
    Intermediate: ['Probability', 'Clocks', 'Compound Interest', 'Coding-Decoding'],
    Advance: ['Number Theory', 'Advanced Aptitude'],
    'Company Related': ['TCS Questions', 'Infosys Questions', 'Accenture Questions'],
    'Government Exams': ['UPSC CSAT Questions', 'SSC CGL Questions']
  };

  const levelTopics = topics[level] || topics.Basic;
  
  // Accept both string list and object list for previousQuestionsList
  const isObjectList = previousQuestionsList.length > 0 && typeof previousQuestionsList[0] === 'object';
  const askedQuestions = isObjectList
    ? previousQuestionsList.map(q => q.questionText)
    : previousQuestionsList;
  const askedTopics = isObjectList
    ? previousQuestionsList.map(q => q.topic || '')
    : [];

  let topic = levelTopics.find(t => !askedTopics.includes(t));
  if (!topic) {
    topic = levelTopics[Math.floor(Math.random() * levelTopics.length)];
  }

  let questionText = '';
  let options = { A: '', B: '', C: '', D: '' };
  let correctOption = 'A';
  let explanation = '';

  // Generate based on topic
  if (topic === 'Percentages') {
    const total = (Math.floor(Math.random() * 9) + 4) * 10; // 40 to 120
    const percent = (Math.floor(Math.random() * 5) + 3) * 10; // 30 to 70
    const boys = Math.round(total * (1 - percent / 100));
    questionText = `In a class of ${total} students, ${percent}% are girls. How many boys are in the class?`;
    options.A = `${boys}`;
    options.B = `${total - boys + 10}`;
    options.C = `${Math.round(total * (percent / 100))}`;
    options.D = `${boys + 5}`;
    explanation = `If ${percent}% are girls, then boys represent ${100 - percent}% of the class. Therefore, number of boys = ${100 - percent}% of ${total} = (${100 - percent}/100) * ${total} = ${boys}.`;
  } 
  else if (topic === 'Profit & Loss') {
    const cp = (Math.floor(Math.random() * 15) + 5) * 10; // 50 to 190
    const profitPercent = (Math.floor(Math.random() * 6) + 2) * 5; // 10 to 40
    const sp = cp * (1 + profitPercent / 100);
    questionText = `A shopkeeper buys an item for $${cp} and sells it for $${sp}. What is the profit percentage?`;
    options.A = `${profitPercent}%`;
    options.B = `${profitPercent + 5}%`;
    options.C = `${profitPercent - 5}%`;
    options.D = `${Math.round(profitPercent * 1.2)}%`;
    explanation = `Profit = Selling Price - Cost Price = $${sp} - $${cp} = $${sp - cp}. Profit % = (Profit / Cost Price) * 100 = (${sp - cp} / ${cp}) * 100 = ${profitPercent}%.`;
  }
  else if (topic === 'Average') {
    const num1 = Math.floor(Math.random() * 30) + 10;
    const num2 = Math.floor(Math.random() * 30) + 20;
    const num3 = Math.floor(Math.random() * 30) + 30;
    const avg = Math.round(((num1 + num2 + num3) / 3) * 10) / 10;
    questionText = `Find the average of the three numbers: ${num1}, ${num2}, and ${num3}.`;
    options.A = `${avg}`;
    options.B = `${Math.round((avg + 2) * 10) / 10}`;
    options.C = `${Math.round((avg - 1.5) * 10) / 10}`;
    options.D = `${Math.round((avg * 1.1) * 10) / 10}`;
    explanation = `Average = (Sum of all values) / Total number of values = (${num1} + ${num2} + ${num3}) / 3 = ${num1 + num2 + num3} / 3 = ${avg}.`;
  }
  else if (topic === 'Ratio') {
    const ratioVal = Math.floor(Math.random() * 3) + 2; // 2, 3, 4
    const totalParts = ratioVal + (ratioVal + 1); // e.g. 2:3 -> 5 parts
    const multiplier = (Math.floor(Math.random() * 5) + 5) * 2; // 10 to 18
    const sum = totalParts * multiplier;
    const smaller = ratioVal * multiplier;
    questionText = `If the ratio of two numbers is ${ratioVal}:${ratioVal + 1} and their sum is ${sum}, find the smaller number.`;
    options.A = `${smaller}`;
    options.B = `${smaller + multiplier}`;
    options.C = `${smaller - multiplier}`;
    options.D = `${sum / 2}`;
    explanation = `Let the numbers be ${ratioVal}x and ${ratioVal + 1}x. Their sum = ${ratioVal}x + ${ratioVal + 1}x = ${totalParts}x = ${sum} => x = ${multiplier}. The smaller number is ${ratioVal}x = ${ratioVal} * ${multiplier} = ${smaller}.`;
  }
  else if (topic === 'Simple Interest') {
    const principal = (Math.floor(Math.random() * 5) + 1) * 1000; // 1000 to 5000
    const rate = Math.floor(Math.random() * 5) + 4; // 4 to 8%
    const years = Math.floor(Math.random() * 3) + 2; // 2 to 4 years
    const si = (principal * rate * years) / 100;
    questionText = `Find the simple interest on $${principal} at ${rate}% per annum for ${years} years.`;
    options.A = `$${si}`;
    options.B = `$${si + 50}`;
    options.C = `$${si - 50}`;
    options.D = `$${si * 1.15}`;
    explanation = `Simple Interest (SI) = (P * R * T) / 100 = (${principal} * ${rate} * ${years}) / 100 = $${si}.`;
  }
  else if (topic === 'Probability') {
    const targetSum = Math.floor(Math.random() * 5) + 6; // 6 to 10
    // Outcomes for sum
    let outcomes = 0;
    for (let d1 = 1; d1 <= 6; d1++) {
      for (let d2 = 1; d2 <= 6; d2++) {
        if (d1 + d2 === targetSum) outcomes++;
      }
    }
    questionText = `What is the probability of getting a sum of ${targetSum} when throwing two fair six-sided dice?`;
    options.A = `${outcomes}/36`;
    options.B = `${outcomes + 1}/36`;
    options.C = `${outcomes - 1}/36`;
    options.D = `1/6`;
    explanation = `Total possible outcomes with 2 dice = 36. Favorable outcomes for a sum of ${targetSum} is ${outcomes}. Hence, probability = ${outcomes}/36.`;
  }
  else if (topic === 'Clocks') {
    const hours = Math.floor(Math.random() * 5) + 2; // 2 to 6
    const minutes = (Math.floor(Math.random() * 6) + 1) * 5; // 5 to 30
    const angle = Math.abs(30 * hours - 5.5 * minutes);
    questionText = `At what angle are the hands of a clock inclined at ${hours} hours ${minutes} minutes?`;
    options.A = `${angle} degrees`;
    options.B = `${angle + 10} degrees`;
    options.C = `${angle - 5} degrees`;
    options.D = `0 degrees`;
    explanation = `Using the formula: Angle = |30 * H - 5.5 * M| = |30 * ${hours} - 5.5 * ${minutes}| = |${30 * hours} - ${5.5 * minutes}| = ${angle} degrees.`;
  }
  else if (topic === 'Compound Interest') {
    const principal = (Math.floor(Math.random() * 3) + 1) * 1000; // 1000 to 3000
    const rate = 10;
    const amount = principal * 1.21; // 2 years at 10%
    const ci = amount - principal;
    questionText = `Find the compound interest on $${principal} at ${rate}% per annum for 2 years compounded annually.`;
    options.A = `$${ci}`;
    options.B = `$${ci + 20}`;
    options.C = `$${ci - 20}`;
    options.D = `$${principal * 0.2}`;
    explanation = `Amount = P * (1 + R/100)^T = ${principal} * (1.1)^2 = ${principal} * 1.21 = $${amount}. Compound Interest = Amount - Principal = $${ci}.`;
  }
  else if (topic === 'Coding-Decoding') {
    questionText = `In a certain code, "APEX" is written as "BQFY". How is "QUIZ" written in that code?`;
    options.A = `RVJA`;
    options.B = `RVJB`;
    options.C = `SWKB`;
    options.D = `PTJY`;
    explanation = `Each letter is shifted forward by +1 letter in the alphabet: Q->R, U->V, I->J, Z->A (loops back). Thus, "QUIZ" becomes "RVJA".`;
  }
  else if (topic === 'Number Theory') {
    const divisor = 101;
    const base = 2;
    const power = 100;
    questionText = `Find the remainder when ${base}^${power} is divided by the prime number ${divisor}.`;
    options.A = `1`;
    options.B = `${divisor - 1}`;
    options.C = `2`;
    options.D = `50`;
    explanation = `By Fermat's Little Theorem, if p is a prime and a is not divisible by p, then a^(p-1) ≡ 1 (mod p). Here, 101 is prime, so 2^100 ≡ 1 (mod 101).`;
  }
  else if (topic === 'Advanced Aptitude') {
    questionText = `If the equation x^2 - px + q = 0 has roots that are consecutive integers, what is the value of p^2 - 4q?`;
    options.A = `1`;
    options.B = `2`;
    options.C = `4`;
    options.D = `0`;
    explanation = `Let the consecutive roots be r and r+1. Sum p = 2r+1. Product q = r(r+1). Then p^2 - 4q = (2r+1)^2 - 4r(r+1) = 4r^2 + 4r + 1 - 4r^2 - 4r = 1.`;
  }
  else if (topic === 'TCS Questions') {
    const men = Math.floor(Math.random() * 5) + 8; // 8 to 12
    const days = Math.floor(Math.random() * 4) + 6; // 6 to 9
    const targetDays = days + 2;
    const requiredMen = Math.round((men * days) / targetDays);
    questionText = `In a placement test: If ${men} men can complete a project in ${days} days, how many men are needed to complete it in ${targetDays} days?`;
    options.A = `${requiredMen}`;
    options.B = `${requiredMen + 3}`;
    options.C = `${requiredMen - 2}`;
    options.D = `${men + 1}`;
    explanation = `Formula: M1 * D1 = M2 * D2. Therefore, ${men} * ${days} = M2 * ${targetDays} => M2 = (${men * days}) / ${targetDays} ≈ ${requiredMen}.`;
  }
  else if (topic === 'Infosys Questions') {
    questionText = `Solve the next sequence element: AB, CD, EF, GH, ...`;
    options.A = `IJ`;
    options.B = `KL`;
    options.C = `MN`;
    options.D = `JI`;
    explanation = `The sequence follows successive alphabetical pairs. Hence, IJ follows GH.`;
  }
  else if (topic === 'Accenture Questions') {
    const ageRatio = 2; // e.g. 2:1
    const sum = 30;
    const younger = sum / (ageRatio + 1);
    const older = younger * ageRatio;
    questionText = `The age ratio of father and son is ${ageRatio}:1. If the sum of their ages is ${sum}, find the father's age.`;
    options.A = `${older} years`;
    options.B = `${younger} years`;
    options.C = `${older + 5} years`;
    options.D = `${older - 5} years`;
    explanation = `Let ages be ${ageRatio}x and x. ${ageRatio}x + x = ${sum} => 3x = 30 => x = 10. Father is ${ageRatio}x = ${older} years old.`;
  }
  else if (topic === 'UPSC CSAT Questions') {
    const val = 40;
    questionText = `If ${val}% of A is equal to 60% of B, what percentage of A is B?`;
    options.A = `${Math.round((val / 60) * 100)}%`;
    options.B = `50%`;
    options.C = `75%`;
    options.D = `120%`;
    explanation = `0.4A = 0.6B => B = (0.4/0.6)A = 2/3 A. So B is approx 67% of A.`;
  }
  else {
    // Default SSC CGL
    const loss = 10;
    const gain = 10;
    const diffVal = 100;
    const cp = (diffVal * 100) / (loss + gain);
    questionText = `A shopkeeper sells an article at a loss of ${loss}%. If he had sold it for $${diffVal} more, he would have gained ${gain}%. Find the Cost Price.`;
    options.A = `$${cp}`;
    options.B = `$${cp + 100}`;
    options.C = `$${cp - 100}`;
    options.D = `$${cp * 1.2}`;
    explanation = `The difference in percentage = ${loss}% + ${gain}% = ${loss + gain}%. So ${loss + gain}% of Cost Price = $${diffVal} => Cost Price = $${cp}.`;
  }

  // Randomize option placement (shuffle)
  const letters = ['A', 'B', 'C', 'D'];
  const optionValues = [options.A, options.B, options.C, options.D];
  
  const shuffledValues = [...optionValues];
  for (let i = shuffledValues.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledValues[i], shuffledValues[j]] = [shuffledValues[j], shuffledValues[i]];
  }

  const randomizedOptions = {
    A: shuffledValues[0],
    B: shuffledValues[1],
    C: shuffledValues[2],
    D: shuffledValues[3]
  };

  const correctLetter = letters[shuffledValues.indexOf(options.A)];

  // Deduplicate against Asked list to ensure strict unique checks
  if (askedQuestions.includes(questionText)) {
    // Modify values slightly to make it unique
    questionText += ' (Verify speed)';
  }

  return {
    questionText,
    options: randomizedOptions,
    correctOption: correctLetter,
    explanation,
    topic
  };
}

// @desc    Dynamically generate hints programmatically
function generateMockHint(questionText, options, hintNumber) {
  const fallbackHints = [
    'Try eliminating the most obviously wrong answer first, then compare the remaining options.',
    'Focus on the key numbers or relationships in the question. Try working backwards from the options.',
    'Identify the formula or concept being tested. Substitute options into the question to verify.'
  ];
  return { hint: fallbackHints[hintNumber - 1] || fallbackHints[0] };
}

// @desc    Dynamically generate analysis programmatically
function generateMockAnalysis(score, level) {
  const strongTopics = score >= 7 ? ["Aptitude Speed", "Conceptual Accuracy"] : ["Basic Logic Operations"];
  const weakTopics = score >= 7 ? ["Complex calculations"] : ["Core Arithmetic", "Time Management"];
  const learningSuggestions = score >= 7 
    ? ["Practice short-cut calculation methods", "Solve advanced logic puzzles"]
    : ["Revisit basic percentage and average rules", "Take timed mock quizzes to improve speed"];
  
  const difficultyAnalysis = score >= 7 
    ? "Excellent execution! You have strong core fundamentals and high accuracy."
    : "Decent effort, but you need to strengthen conceptual clarity and work on speed.";

  let recommendedNextLevel = level;
  if (score >= 8) {
    if (level === 'Basic') recommendedNextLevel = 'Intermediate';
    else if (level === 'Intermediate') recommendedNextLevel = 'Advance';
  } else if (score < 5) {
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


