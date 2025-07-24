import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI } from '@google/generative-ai';
import ProblemModel, { connectDB } from '../app/api/(models)/Problem.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyAqsvbQJeTaRvnu6iYpU-j0X0rKBszsy8M");

const generatePrompt = (title, description) => `
You are given the following programming problem titled "${title}":

${description}

Generate 10 unique test cases for this problem. Each test case should be in the format:
{
  "input": "<string passed to stdin>",
  "expected_output": "<string expected as stdout>"
}

Respond only with a JSON array.
`;

const main = async () => {
  await connectDB();

  const problem = await ProblemModel.findOne({
    $or: [
      { test_cases: { $exists: false } },
      { test_cases: null },
      { test_cases: { $size: 0 } }
    ]
  });

  if (!problem) {
    console.log('No problems found needing test cases.');
    return;
  }

  const prompt = generatePrompt(problem.title, problem.description);

  try {
    const modelOptions = [
      'gemini-2.5-flash',
      'gemini-2.0-flash', 
      'gemini-1.5-flash',
      'gemini-1.5-pro'
    ];

    let model;
    let lastError;

    for (const modelName of modelOptions) {
      try {
        model = genAI.getGenerativeModel({ model: modelName });
        console.log(`Using model: ${modelName}`);
        break;
      } catch (err) {
        lastError = err;
        console.log(`Model ${modelName} not available, trying next...`);
        continue;
      }
    }

    if (!model) {
      throw new Error(`No available models found. Last error: ${lastError?.message}`);
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\[.*\]/s);
    const testCases = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    if (!Array.isArray(testCases) || testCases.length === 0) {
      throw new Error("No valid test cases returned.");
    }

    problem.test_cases = testCases;
    await problem.save();

    console.log(`✅ Added ${testCases.length} test cases to "${problem.title}"`);
  } catch (err) {
    console.error("❌ Error generating test cases:", err.message);
  }
};

main();