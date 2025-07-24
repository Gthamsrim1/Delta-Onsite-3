import fs from 'fs';
import Papa from 'papaparse';
import ProblemModel from '../app/api/(models)/Problem.js';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://gauthamsriram16:PM5X01kRNluoKVie@delta-onsite-1.4vlboga.mongodb.net/";

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in environment variables');
}

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

const importCSVToMongoDB = async (csvFilePath) => {
  try {
    await connectDB();
    
    const csvFile = fs.readFileSync(csvFilePath, 'utf8');
    
    // Parse CSV
    const parsedData = Papa.parse(csvFile, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim()
    });

    if (parsedData.errors.length > 0) {
      console.error('CSV parsing errors:', parsedData.errors);
      return;
    }

    const problems = parsedData.data;
    console.log(`Found ${problems.length} problems to import`);

    // Transform and import data
    const transformedProblems = problems.map(row => {
      // Parse companies (comma-separated string to array)
      let companies = [];
      if (row.companies && typeof row.companies === 'string') {
        companies = row.companies.split(',').map(company => company.trim());
      }

      // Parse related topics (comma-separated string to array)
      let relatedTopics = [];
      if (row.related_topics && typeof row.related_topics === 'string') {
        relatedTopics = row.related_topics.split(',').map(topic => topic.trim());
      }

      // Parse similar questions (complex string format to array of objects)
      let similarQuestions = [];
      if (row.similar_questions && typeof row.similar_questions === 'string') {
        try {
          // Remove outer brackets and split by '], ['
          const questionsStr = row.similar_questions
            .replace(/^\[|\]$/g, '') // Remove outer brackets
            .replace(/\], \[/g, '|'); // Replace '], [' with delimiter
          
          const questionParts = questionsStr.split('|');
          
          similarQuestions = questionParts.map(part => {
            const matches = part.split(', ');
            if (matches.length >= 3) {
              return {
                title: matches[0].trim(),
                slug: matches[1].replace(/^\/problems\/|\/$/g, '').trim(),
                difficulty: matches[2].trim()
              };
            }
            return null;
          }).filter(q => q !== null);
        } catch (error) {
          console.warn(`Error parsing similar_questions for problem ${row.id}:`, error.message);
          similarQuestions = [];
        }
      }

      return {
        _id: parseInt(row.id),
        title: row.title || '',
        description: row.description || '',
        is_premium: Boolean(row.is_premium),
        difficulty: row.difficulty || 'Easy',
        solution_link: row.solution_link || '',
        acceptance_rate: row.acceptance_rate ? row.acceptance_rate.toString() : '',
        frequency: parseFloat(row.frequency) || 0,
        url: row.url || '',
        discuss_count: parseInt(row.discuss_count) || 0,
        accepted: row.accepted ? parseInt(row.accepted.toString().replace(/[^\d]/g, '')) || 0 : 0,
        submissions: row.submissions ? parseInt(row.submissions.toString().replace(/[^\d]/g, '')) || 0 : 0,
        companies: companies,
        related_topics: relatedTopics,
        asked_by_faang: Boolean(row.asked_by_faang),
        similar_questions: similarQuestions
      };
    });

    // Insert data in batches to handle large datasets
    const batchSize = 100;
    let imported = 0;
    let errors = 0;

    for (let i = 0; i < transformedProblems.length; i += batchSize) {
      const batch = transformedProblems.slice(i, i + batchSize);
      
      try {
        // Use insertMany with ordered: false to continue on duplicate key errors
        await ProblemModel.insertMany(batch, { ordered: false });
        imported += batch.length;
        console.log(`Imported batch ${Math.floor(i / batchSize) + 1}, total imported: ${imported}`);
      } catch (error) {
        if (error.name === 'BulkWriteError') {
          // Handle duplicate key errors and other bulk write errors
          const successfulInserts = error.result.insertedCount;
          imported += successfulInserts;
          errors += (batch.length - successfulInserts);
          console.log(`Batch ${Math.floor(i / batchSize) + 1}: ${successfulInserts} inserted, ${batch.length - successfulInserts} errors`);
        } else {
          console.error(`Error importing batch ${Math.floor(i / batchSize) + 1}:`, error.message);
          errors += batch.length;
        }
      }
    }

    console.log('\n=== Import Summary ===');
    console.log(`Total problems processed: ${transformedProblems.length}`);
    console.log(`Successfully imported: ${imported}`);
    console.log(`Errors/Duplicates: ${errors}`);
    
  } catch (error) {
    console.error('Import failed:', error);
  }
};

// Usage
const csvFilePath = './leetcode_dataset - lc.csv'; // Adjust path to your CSV file
importCSVToMongoDB(csvFilePath);

// Alternative: Export the function for use in other files
export { importCSVToMongoDB };