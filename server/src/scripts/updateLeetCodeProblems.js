/**
 * Script to update all existing LeetCode problems with:
 * 1. Code snippets (defaultCode) from LeetCode API
 * 2. Generated driver code for LeetCode-style execution
 * 
 * Also optionally removes DSAstra test problems.
 * 
 * Usage: 
 *   node server/src/scripts/updateLeetCodeProblems.js
 *   node server/src/scripts/updateLeetCodeProblems.js --delete-dsastra
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Problem = require('../models/Problem');

// Import driver code generators from scraper
const {
  generateDriverCode,
  getCppTypeInfo,
  generateCppDriver,
  generatePythonDriver,
  generateJavaDriver,
  generateJavaScriptDriver
} = require('../utils/scraper');

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/algopilot';

// Rate limiting - LeetCode blocks rapid requests
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch code snippets and metadata for a LeetCode problem
 */
async function fetchLeetCodeCodeSnippets(titleSlug) {
  try {
    const { data } = await axios.post(
      'https://leetcode.com/graphql/',
      {
        query: `query getQuestion($titleSlug: String!) {
          question(titleSlug: $titleSlug) {
            questionId
            title
            codeSnippets {
              lang
              langSlug
              code
            }
            metaData
            exampleTestcases
          }
        }`,
        variables: { titleSlug },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://leetcode.com',
          'Referer': `https://leetcode.com/problems/${titleSlug}/`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 15000,
      }
    );

    const q = data?.data?.question;
    if (!q) return null;

    return {
      codeSnippets: q.codeSnippets || [],
      metaData: q.metaData,
      exampleTestcases: q.exampleTestcases
    };
  } catch (error) {
    console.error(`Failed to fetch ${titleSlug}:`, error.message);
    return null;
  }
}

/**
 * Process code snippets into defaultCode object
 */
function processCodeSnippets(codeSnippets) {
  const defaultCode = {};
  const langMap = {
    'cpp': 'cpp',
    'java': 'java',
    'python3': 'python',
    'python': 'python',
    'javascript': 'javascript',
    'c': 'c'
  };

  for (const snippet of codeSnippets) {
    const ourLang = langMap[snippet.langSlug];
    if (ourLang && snippet.code) {
      defaultCode[ourLang] = snippet.code;
    }
  }

  return defaultCode;
}

/**
 * Generate driver code based on metadata
 */
function generateDriverCodeFromMeta(metaData, defaultCode) {
  if (!metaData) return {};

  let meta;
  try {
    meta = typeof metaData === 'string' ? JSON.parse(metaData) : metaData;
  } catch (e) {
    return {};
  }

  return generateDriverCode(meta, defaultCode);
}

/**
 * Extract titleSlug from LeetCode URL
 */
function getTitleSlug(url) {
  const match = url.match(/leetcode\.com\/problems\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const deleteDsastra = args.includes('--delete-dsastra');

  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!\n');

  // Delete DSAstra problems if requested
  if (deleteDsastra) {
    console.log('Deleting DSAstra test problems...');
    const deleteResult = await Problem.deleteMany({ platform: 'DSAstra' });
    console.log(`Deleted ${deleteResult.deletedCount} DSAstra problems.\n`);
  }

  // Get all LeetCode problems
  const problems = await Problem.find({ platform: 'LeetCode' });
  console.log(`Found ${problems.length} LeetCode problems to update.\n`);

  let updated = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < problems.length; i++) {
    const problem = problems[i];
    const titleSlug = getTitleSlug(problem.url);

    if (!titleSlug) {
      console.log(`[${i + 1}/${problems.length}] ⚠️ Skipping ${problem.title} - no valid URL`);
      skipped++;
      continue;
    }

    // Force update of all problems to inject new Universal Polyfills
    console.log(`[${i + 1}/${problems.length}] Fetching ${problem.title} (${titleSlug})...`);

    const data = await fetchLeetCodeCodeSnippets(titleSlug);

    if (!data || !data.codeSnippets || data.codeSnippets.length === 0) {
      console.log(`  ❌ Failed to fetch code snippets`);
      failed++;
      // Add delay even on failure
      await sleep(1500);
      continue;
    }

    const defaultCode = processCodeSnippets(data.codeSnippets);
    const driverCode = generateDriverCodeFromMeta(data.metaData, defaultCode);

    // Update the problem
    problem.defaultCode = defaultCode;
    if (Object.keys(driverCode).length > 0) {
      problem.driverCode = driverCode;
    }

    // Update examples if we got new ones
    if (data.exampleTestcases) {
      problem.examples = data.exampleTestcases;
    }

    await problem.save();
    console.log(`  ✅ Updated with ${Object.keys(defaultCode).length} languages, ${Object.keys(driverCode).length} drivers`);
    updated++;

    // Rate limiting - wait between requests to avoid being blocked
    await sleep(2000);
  }

  console.log('\n═══════════════════════════════════════');
  console.log(`Update complete!`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Failed: ${failed}`);
  console.log('═══════════════════════════════════════\n');

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
