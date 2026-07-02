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

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/algopilot';

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
    meta = JSON.parse(metaData);
  } catch (e) {
    return {};
  }

  if (!meta.name || !meta.params) return {};

  const funcName = meta.name;
  const params = meta.params || [];
  const returnType = meta.return?.type || 'void';

  const driverCode = {};

  // Generate C++ driver
  if (defaultCode.cpp) {
    driverCode.cpp = generateCppDriverCode(funcName, params, returnType, defaultCode.cpp);
  }

  // Generate Python driver
  if (defaultCode.python) {
    driverCode.python = generatePythonDriverCode(funcName, params, returnType);
  }

  // Generate Java driver
  if (defaultCode.java) {
    driverCode.java = generateJavaDriverCode(funcName, params, returnType);
  }

  // Generate JavaScript driver
  if (defaultCode.javascript) {
    driverCode.javascript = generateJavaScriptDriverCode(funcName, params, returnType);
  }

  return driverCode;
}

// ─── Driver Code Generators ───

function getCppTypeMapping(lcType) {
  const typeMap = {
    'integer': { cppType: 'int', parse: 'cin >> VAR;', print: 'cout << VAR' },
    'long': { cppType: 'long long', parse: 'cin >> VAR;', print: 'cout << VAR' },
    'double': { cppType: 'double', parse: 'cin >> VAR;', print: 'cout << fixed << setprecision(5) << VAR' },
    'boolean': { cppType: 'bool', parse: 'string _VAR; cin >> _VAR; VAR = (_VAR == "true");', print: 'cout << (VAR ? "true" : "false")' },
    'string': { cppType: 'string', parse: 'cin >> ws; getline(cin, VAR);', print: 'cout << "\\"" << VAR << "\\""' },
    'integer[]': { cppType: 'vector<int>', parse: 'VAR = parseIntArray();', print: 'printIntArray(VAR)' },
    'integer[][]': { cppType: 'vector<vector<int>>', parse: 'VAR = parseIntMatrix();', print: 'printIntMatrix(VAR)' },
    'string[]': { cppType: 'vector<string>', parse: 'VAR = parseStringArray();', print: 'printStringArray(VAR)' },
    'character[]': { cppType: 'vector<char>', parse: 'VAR = parseCharArray();', print: 'printCharArray(VAR)' },
    'character[][]': { cppType: 'vector<vector<char>>', parse: 'VAR = parseCharMatrix();', print: 'printCharMatrix(VAR)' },
    'list<integer>': { cppType: 'vector<int>', parse: 'VAR = parseIntArray();', print: 'printIntArray(VAR)' },
  };

  return typeMap[lcType] || { cppType: 'auto', parse: 'cin >> VAR;', print: 'cout << VAR' };
}

function generateCppDriverCode(funcName, params, returnType, defaultCode) {
  const isClassBased = defaultCode.includes('class Solution');
  const className = isClassBased ? 'Solution' : '';

  let inputParsing = '';
  let funcArgs = [];

  for (const param of params) {
    const typeInfo = getCppTypeMapping(param.type);
    const varName = param.name;
    inputParsing += `    ${typeInfo.cppType} ${varName};\n`;
    inputParsing += `    ${typeInfo.parse.replace(/VAR/g, varName)}\n`;
    funcArgs.push(varName);
  }

  const returnInfo = getCppTypeMapping(returnType);
  const resultPrint = returnInfo.print.replace(/VAR/g, 'result');

  return `#include <bits/stdc++.h>
using namespace std;

// ─── Helper Functions ───
vector<int> parseIntArray() {
    string line; getline(cin, line);
    vector<int> arr;
    stringstream ss(line);
    char c; int num;
    while (ss >> c) {
        if (c == '[' || c == ']' || c == ',') continue;
        ss.putback(c);
        if (ss >> num) arr.push_back(num);
    }
    return arr;
}

vector<vector<int>> parseIntMatrix() {
    string line; getline(cin, line);
    vector<vector<int>> matrix;
    vector<int> current;
    string num = "";
    for (char c : line) {
        if (c >= '0' && c <= '9' || c == '-') num += c;
        else {
            if (!num.empty()) { current.push_back(stoi(num)); num = ""; }
            if (c == ']' && !current.empty()) { matrix.push_back(current); current.clear(); }
        }
    }
    return matrix;
}

vector<string> parseStringArray() {
    string line; getline(cin, line);
    vector<string> arr;
    string current = "";
    bool inQuote = false;
    for (char c : line) {
        if (c == '"') { inQuote = !inQuote; if (!inQuote && !current.empty()) { arr.push_back(current); current = ""; } }
        else if (inQuote) current += c;
    }
    return arr;
}

void printIntArray(const vector<int>& arr) {
    cout << "[";
    for (int i = 0; i < arr.size(); i++) {
        if (i > 0) cout << ",";
        cout << arr[i];
    }
    cout << "]" << endl;
}

void printIntMatrix(const vector<vector<int>>& matrix) {
    cout << "[";
    for (int i = 0; i < matrix.size(); i++) {
        if (i > 0) cout << ",";
        cout << "[";
        for (int j = 0; j < matrix[i].size(); j++) {
            if (j > 0) cout << ",";
            cout << matrix[i][j];
        }
        cout << "]";
    }
    cout << "]" << endl;
}

void printStringArray(const vector<string>& arr) {
    cout << "[";
    for (int i = 0; i < arr.size(); i++) {
        if (i > 0) cout << ",";
        cout << "\\"" << arr[i] << "\\"";
    }
    cout << "]" << endl;
}

// ─── User Code ───
\${USER_CODE_PLACEHOLDER}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
${inputParsing}
    ${isClassBased ? className + ' sol;' : ''}
    ${returnType !== 'void' ? `auto result = ${isClassBased ? 'sol.' : ''}${funcName}(${funcArgs.join(', ')});` : `${isClassBased ? 'sol.' : ''}${funcName}(${funcArgs.join(', ')});`}
    ${returnType !== 'void' ? resultPrint + ' << endl;' : ''}
    
    return 0;
}`;
}

function generatePythonDriverCode(funcName, params, returnType) {
  let inputParsing = '';
  let funcArgs = [];

  for (let i = 0; i < params.length; i++) {
    const param = params[i];
    const varName = param.name;

    if (param.type.includes('[]') || param.type.includes('list')) {
      inputParsing += `    ${varName} = eval(input())\n`;
    } else if (param.type === 'integer' || param.type === 'long') {
      inputParsing += `    ${varName} = int(input())\n`;
    } else if (param.type === 'double') {
      inputParsing += `    ${varName} = float(input())\n`;
    } else if (param.type === 'boolean') {
      inputParsing += `    ${varName} = input().strip().lower() == 'true'\n`;
    } else {
      inputParsing += `    ${varName} = input().strip()\n`;
    }
    funcArgs.push(varName);
  }

  return `import sys
from typing import List, Optional
from collections import deque

\${USER_CODE_PLACEHOLDER}

if __name__ == "__main__":
${inputParsing}
    sol = Solution()
    result = sol.${funcName}(${funcArgs.join(', ')})
    ${returnType === 'boolean' ? "print('true' if result else 'false')" : 'print(result)'}`;
}

function generateJavaDriverCode(funcName, params, returnType) {
  let inputParsing = '';
  let funcArgs = [];

  for (const param of params) {
    const varName = param.name;

    if (param.type === 'integer[]') {
      inputParsing += `        String[] ${varName}Str = sc.nextLine().replaceAll("[\\\\[\\\\]\\\\s]", "").split(",");
        int[] ${varName} = Arrays.stream(${varName}Str).filter(s -> !s.isEmpty()).mapToInt(Integer::parseInt).toArray();\n`;
    } else if (param.type === 'integer') {
      inputParsing += `        int ${varName} = Integer.parseInt(sc.nextLine().trim());\n`;
    } else if (param.type === 'string') {
      inputParsing += `        String ${varName} = sc.nextLine().trim().replace("\\"", "");\n`;
    } else {
      inputParsing += `        String ${varName} = sc.nextLine().trim();\n`;
    }
    funcArgs.push(varName);
  }

  return `import java.util.*;
import java.io.*;

\${USER_CODE_PLACEHOLDER}

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
${inputParsing}
        Solution sol = new Solution();
        ${returnType !== 'void' ? `var result = sol.${funcName}(${funcArgs.join(', ')});` : `sol.${funcName}(${funcArgs.join(', ')});`}
        ${returnType === 'integer[]' ? 'System.out.println(Arrays.toString(result));' : returnType === 'boolean' ? 'System.out.println(result ? "true" : "false");' : returnType !== 'void' ? 'System.out.println(result);' : ''}
    }
}`;
}

function generateJavaScriptDriverCode(funcName, params, returnType) {
  let inputParsing = '';
  let funcArgs = [];

  for (let i = 0; i < params.length; i++) {
    const param = params[i];
    const varName = param.name;

    if (param.type.includes('[]')) {
      inputParsing += `    const ${varName} = JSON.parse(lines[${i}]);\n`;
    } else if (param.type === 'integer' || param.type === 'long') {
      inputParsing += `    const ${varName} = parseInt(lines[${i}]);\n`;
    } else if (param.type === 'double') {
      inputParsing += `    const ${varName} = parseFloat(lines[${i}]);\n`;
    } else if (param.type === 'boolean') {
      inputParsing += `    const ${varName} = lines[${i}].trim().toLowerCase() === 'true';\n`;
    } else {
      inputParsing += `    const ${varName} = lines[${i}].trim().replace(/"/g, '');\n`;
    }
    funcArgs.push(varName);
  }

  return `const readline = require('readline');

\${USER_CODE_PLACEHOLDER}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

let lines = [];
rl.on('line', (line) => lines.push(line));
rl.on('close', () => {
${inputParsing}
    const result = ${funcName}(${funcArgs.join(', ')});
    ${returnType === 'boolean' ? "console.log(result ? 'true' : 'false');" : 'console.log(JSON.stringify(result));'}
});`;
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

    // Skip if already has defaultCode
    if (problem.defaultCode && Object.keys(problem.defaultCode).length > 0) {
      console.log(`[${i + 1}/${problems.length}] ⏭️ Skipping ${problem.title} - already has code templates`);
      skipped++;
      continue;
    }

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
