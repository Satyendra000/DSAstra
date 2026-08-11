const { GoogleGenAI } = require('@google/genai');

let aiClient = null;
function getAI() {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in environment variables. Please get a free key from aistudio.google.com and add it to your .env file.");
    }
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

async function generateExecutionEngine(problem) {
  const isLeetCode = problem.platform === "LeetCode";
  
  const systemInstruction = `
You are an expert competitive programming backend engineer. 
Your task is to generate the backend evaluation engine for the following problem.

PROBLEM PLATFORM: ${problem.platform}
TITLE: ${problem.title}
DESCRIPTION:
${problem.description?.substring(0, 3000) || "No description provided."}

${isLeetCode ? `
DEFAULT SIGNATURES:
${JSON.stringify(problem.defaultCode || {})}

CRITICAL REQUIREMENTS FOR LEETCODE:
1. You MUST generate Driver Code for cpp, java, python, and javascript.
2. The Driver Code MUST inject the user's code using EXACTLY the string \`\${USER_CODE_PLACEHOLDER}\`.
3. You must include \`// ===== USER CODE START =====\` and \`// ===== USER CODE END =====\` around the placeholder.
4. STDIN FORMAT RULE (CRITICAL — do not break this): testCase inputs MUST use a plain whitespace/newline format. NO brackets, NO commas. For arrays, put the array length N on one line, then all N space-separated numbers on the next line. For single integers, just put the integer on its own line. Example for Two Sum: "4\\n2 7 11 15\\n9" means N=4, nums=[2,7,11,15], target=9. Your C++ driver must read this with cin >> n, then cin >> nums[i] in a loop, then cin >> target. This ensures cin >> works without any string parsing.
5. If the problem's default signature uses a class (e.g., 'class Solution'), your Driver Code MUST instantiate that class before calling the method (e.g., 'Solution solution; auto res = solution.twoSum(...);'). Do not call the method globally if it is inside a class.
6. Output format: For array results, print elements separated by commas inside square brackets (e.g., [0,1]). For single integer results, just print the integer.
7. You MUST generate a robust suite of hidden test cases (aim for 20 to 50 highly diverse test cases). For each test case, provide your best estimate of the expected output. IMPORTANT: EVERY test case MUST have a valid answer according to the problem constraints. Do not generate impossible test cases!
8. Your Driver Code (especially C++) MUST safely handle edge cases (e.g. empty arrays or null pointers returned) to prevent segmentation faults. For example, if it expects a vector of size 2, check \`res.size() >= 2\` before accessing \`res[0]\`.
9. You MUST also generate a "referenceSolution" field containing a short, correct, brute-force solution to the problem in C++. This solution must be a complete standalone class/function that solves the problem correctly. It will be used to verify the test case outputs.
` : `
CRITICAL REQUIREMENTS FOR CODEFORCES/CODECHEF:
1. Users write the full \`main()\` function themselves for this platform, so NO driver code is needed.
2. You MUST generate a robust suite of hidden test cases (aim for 20 to 50 highly diverse test cases). The input must be exactly what the user's \`main()\` function will read from stdin, and the output must be exactly what it prints to stdout. Cover edge cases, maximum constraints, minimum constraints, and empty structures. CRITICAL: You must manually calculate the exact expected output for each test case. Ensure outputs are 100% correct, mathematically valid (no NaN), and perfectly formatted according to the problem requirements.
`}

OUTPUT FORMAT:
You MUST return ONLY a valid JSON object. Do NOT wrap it in markdown code blocks (\`\`\`json). Just the raw JSON.
WARNING: Double check every single test case output to ensure absolute mathematical correctness! Do not output NaN, null, or undefined unless explicitly required by the problem.

SCHEMA:
{
  ${isLeetCode ? `
  "driverCode": {
    "cpp": "#include <bits/stdc++.h>\\nusing namespace std;\\n\\n// ===== USER CODE START =====\\n\${USER_CODE_PLACEHOLDER}\\n// ===== USER CODE END =====\\n\\nint main() { int n; cin >> n; vector<int> nums(n); for(int i=0;i<n;i++) cin >> nums[i]; int target; cin >> target; Solution sol; auto res = sol.twoSum(nums,target); if(res.size() >= 2) cout << '[' << res[0] << ',' << res[1] << ']'; else cout << \\\"[-1,-1]\\\"; }",
    "java": "import java.util.*;\\n\\n// ===== USER CODE START =====\\n\${USER_CODE_PLACEHOLDER}\\n// ===== USER CODE END =====\\n\\npublic class Main { ... }",
    "python": "import sys\\n\\n# ===== USER CODE START =====\\n\${USER_CODE_PLACEHOLDER}\\n# ===== USER CODE END =====\\n\\nif __name__ == '__main__': ...",
    "javascript": "const readline = require('readline');\\n\\n// ===== USER CODE START =====\\n\${USER_CODE_PLACEHOLDER}\\n// ===== USER CODE END =====\\n\\n..."
  },
  ` : `
  "driverCode": {
    "cpp": "",
    "java": "",
    "python": "",
    "javascript": ""
  },
  `}
  "referenceSolution": "class Solution { public: vector<int> twoSum(vector<int>& nums, int target) { ... } };",
  "testCases": [
    { "input": "...", "output": "..." },
    { "input": "...", "output": "..." },
    { "input": "...", "output": "..." }
  ]
}
  `;

  try {
    const response = await getAI().models.generateContent({
      model: 'gemini-3.5-flash',
      contents: systemInstruction,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    });

    let text = response.text || "";
    
    // Clean markdown if AI accidentally included it
    if (text.startsWith("\`\`\`json")) {
      text = text.replace(/^\`\`\`json\n/, "").replace(/\n\`\`\`$/, "");
    } else if (text.startsWith("\`\`\`")) {
      text = text.replace(/^\`\`\`\n/, "").replace(/\n\`\`\`$/, "");
    }

    const parsed = JSON.parse(text);

    // Validate
    if (!parsed.testCases || !Array.isArray(parsed.testCases)) {
      throw new Error("AI failed to generate testCases array.");
    }

    if (isLeetCode && (!parsed.driverCode || !parsed.driverCode.cpp)) {
      throw new Error("AI failed to generate driverCode for LeetCode problem.");
    }

    // Validate test case outputs by running them through Judge0 with the reference solution
    if (isLeetCode && parsed.referenceSolution && parsed.driverCode?.cpp && parsed.testCases?.length > 0) {
      try {
        console.log(`[aiService] Validating ${parsed.testCases.length} test cases via Judge0...`);
        const validatedTestCases = await validateTestCasesViaJudge0(
          parsed.referenceSolution,
          parsed.driverCode.cpp,
          parsed.testCases
        );
        parsed.testCases = validatedTestCases;
        console.log(`[aiService] ✅ Validated ${validatedTestCases.length} test cases.`);
      } catch (valErr) {
        console.warn(`[aiService] ⚠️ Judge0 validation failed, using AI outputs as-is:`, valErr.message);
      }
    }

    return parsed;
  } catch (error) {
    console.error("[aiService] Error generating execution engine:", error.message);
    if (error.message.includes("429") || error.message.includes("Quota")) {
      throw new Error("API Rate Limit Exceeded (429). Please wait 1 minute before retrying.");
    }
    throw error;
  }
}

async function generateGlobalHints(problem) {
  const systemInstruction = `
You are an expert algorithmic mentor. Your task is to generate 3 to 4 sequential, conceptual hints for the following problem.
These hints should not give away the direct answer or specific code. Instead, use conceptual analogies and intuition-building explanations to guide the user's thinking.
Do not just ask questions; actively teach them how to approach the problem, understand the constraints, and build the mental models needed to solve it optimally.
The hints should progressively get more specific.

PROBLEM TITLE: ${problem.title}
DESCRIPTION:
${problem.description?.substring(0, 3000) || "No description provided."}

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this schema. Do not wrap in markdown blocks.
SCHEMA:
{
  "hints": [
    "Hint 1 text (Markdown string)",
    "Hint 2 text (Markdown string)",
    "Hint 3 text (Markdown string)"
  ]
}
  `;

  try {
    const response = await getAI().models.generateContent({
      model: 'gemini-3.5-flash',
      contents: systemInstruction,
      config: {
        responseMimeType: "application/json",
        temperature: 0.4
      }
    });

    let text = response.text || "";
    if (text.startsWith("\`\`\`json")) text = text.replace(/^\`\`\`json\n/, "").replace(/\n\`\`\`$/, "");
    else if (text.startsWith("\`\`\`")) text = text.replace(/^\`\`\`\n/, "").replace(/\n\`\`\`$/, "");

    const parsed = JSON.parse(text);
    return parsed.hints || [];
  } catch (error) {
    console.error("[aiService] Error generating global hints:", error.message);
    return []; // Fail gracefully
  }
}

async function generatePersonalizedHint(problem, userCode, language, previousHints = []) {
  const previousHintsText = previousHints && previousHints.length > 0 
    ? `\nPREVIOUS HINTS GIVEN TO USER FOR THIS EXACT CODE:\n${previousHints.map((h, i) => `[Hint ${i+1}]: ${h}`).join("\n")}\n\nCRITICAL INSTRUCTION: The user did NOT understand the previous hints and requested another one. You MUST provide a NEW, DEEPER hint that goes further than the previous ones. Build upon the previous hints and push them closer to the actual answer/solution to clear their whole picture. Do NOT repeat the previous hints.`
    : "";

  const systemInstruction = `
You are a sharp, concise algorithmic mentor. Analyze the user's code and respond in ONE of two modes:

**MODE A — Code has a flaw**: Give an intuition-building explanation (2 to 4 sentences) that helps the user understand exactly *why* their code fails or is suboptimal. Explain the edge case or conceptual gap they missed. Guide them toward the correct mindset to fix their bugs without just asking vague questions. Do NOT name the algorithm or data structure. Do NOT write code.

**MODE B — Code looks correct**: Briefly compliment their approach, then actively teach them *how* and *why* to optimize it further (using 2 to 5 sentences). Clearly explain the exact mechanical bottleneck in their current approach (e.g., redundant work, time/space complexity) and walk them through the conceptual thinking process required to reach a more optimal solution. Build their intuition so they deeply understand the mechanics of the optimization, rather than just telling them that it can be optimized. Keep it highly educational.

PROBLEM TITLE: ${problem.title}
LANGUAGE: ${language}
USER CODE:
\`\`\`${language}
${userCode.substring(0, 3000)}
\`\`\`
${previousHintsText}

STRICT RULES:
- Maximum 200 words in your entire response.
- Use bold for key phrases only.
- Never write code snippets.
- Never name specific data structures or algorithms directly.
- Return raw Markdown only.
  `;

  try {
    const response = await getAI().models.generateContent({
      model: 'gemini-3.5-flash',
      contents: systemInstruction,
      config: {
        temperature: 0.5
      }
    });

    return response.text || "I'm having trouble analyzing your code right now. Try again in a moment!";
  } catch (error) {
    console.error("[aiService] Error generating personalized hint:", error.message);
    throw new Error("Failed to generate personalized hint.");
  }
}

/**
 * Validate AI-generated test case outputs by running them through Judge0
 * with a known-correct reference solution. This guarantees mathematical correctness
 * instead of trusting the LLM's calculations.
 */
async function validateTestCasesViaJudge0(referenceSolution, driverCodeCpp, testCases) {
  const axios = require('axios');
  const judge0Url = process.env.JUDGE0_API_URL || "http://localhost:2358";
  const b64 = (str) => Buffer.from(str || "").toString("base64");
  const dec = (str) => str ? Buffer.from(str, "base64").toString("utf-8") : null;

  // Build the full reference source code
  const fullRefCode = driverCodeCpp.replace("${USER_CODE_PLACEHOLDER}", referenceSolution);

  const BATCH_SIZE = 15;
  const validatedTestCases = [];

  for (let i = 0; i < testCases.length; i += BATCH_SIZE) {
    const batch = testCases.slice(i, i + BATCH_SIZE);

    const results = await Promise.all(
      batch.map(async (tc) => {
        try {
          const response = await axios.post(
            `${judge0Url}/submissions?base64_encoded=true&wait=true`,
            {
              source_code: b64(fullRefCode),
              stdin: b64(tc.input || ""),
              language_id: 54, // C++
            },
            { headers: { "Content-Type": "application/json" }, timeout: 30000 }
          );

          const stdout = dec(response.data.stdout);
          if (response.data.status?.id === 3 && stdout) {
            return { input: tc.input, output: stdout.trim() };
          }
          // If reference solution fails on this input (e.g. segfault, TLE), the testcase is INVALID. Drop it!
          console.warn(`[aiService] Reference solution failed (status ${response.data.status?.id}) on input: ${tc.input?.substring(0, 50).replace(/\n/g, ' ')}... Dropping this test case.`);
          return null;
        } catch (err) {
          console.warn(`[aiService] Judge0 call failed for input:`, err.message);
          return null;
        }
      })
    );

    validatedTestCases.push(...results.filter(tc => tc !== null));
  }

  return validatedTestCases;
}

async function generateConceptGuide(problem) {
  const systemInstruction = `
You are an expert computer science instructor.
Your task is to create a "Concept Guide" for a given coding problem.
This guide should teach the underlying concepts, algorithms, and data structures needed to solve the problem.
DO NOT provide the final code solution. Build the user's intuition.
Use beautiful, well-formatted Markdown with headings, bold text, and bullet points.

PROBLEM TITLE: ${problem.title}
DESCRIPTION: ${problem.description?.substring(0, 2000) || "No description provided."}

Sections to include:
1. **Core Concepts**: Explain the main algorithms/patterns (e.g., Sliding Window, Hash Maps) needed.
2. **Intuition**: Walk through how to think about the problem conceptually. CRITICAL: Provide a high-level mental model or analogy ONLY. DO NOT write a step-by-step algorithm, DO NOT write pseudocode, and DO NOT give away the exact implementation details. The user must figure out the specific step-by-step logic themselves based on this high-level hint!
3. **Common Pitfalls**: Mention edge cases or mistakes to avoid.
4. **Time & Space Complexity**: Explain the target complexity for an optimal solution.

Return ONLY raw Markdown text. No JSON, no code snippets of the final answer, and absolutely no step-by-step pseudocode.
  `;

  try {
    const response = await getAI().models.generateContent({
      model: 'gemini-3.5-flash',
      contents: systemInstruction,
      config: {
        temperature: 0.6
      }
    });
    return response.text || "Could not generate a concept guide.";
  } catch (error) {
    console.error("[aiService] Error generating concept guide:", error.message);
    throw new Error("Failed to generate concept guide.");
  }
}

/**
 * AI-powered problem description formatting and enhancement.
 * Cleans up raw HTML, standardizes formatting to LeetCode-style,
 * and infers/appends explanations for example test cases if missing.
 */
async function enhanceProblemDescription(htmlContent, platform, title) {
  const systemInstruction = `
You are an expert technical writer for a competitive programming platform.
Your task is to take a raw, scraped HTML problem description from ${platform} (Problem: ${title}) and reformat it into clean, standardized, LeetCode-style HTML.

CRITICAL REQUIREMENTS:
1. SEMANTIC HTML: Use only clean, semantic HTML tags (e.g., <p>, <ul>, <li>, <strong>, <code>, <pre>). Do NOT include <html>, <head>, or <body> tags. Do NOT wrap your response in markdown code blocks (\`\`\`html) - just output the raw HTML string.
2. CLEANUP: Completely remove any messy scraping artifacts, ads, navigation links, inline CSS styles, or irrelevant script tags.
3. EXAMPLES: Standardize all example test case blocks to match LeetCode's style. 
   Use this exact HTML format for examples:
   <strong class="example">Example 1:</strong>
   <pre>
   <strong>Input:</strong> ...
   <strong>Output:</strong> ...
   <strong>Explanation:</strong> ...
   </pre>
   CRITICAL FOR INPUT/OUTPUT TEXT: You MUST PRESERVE the exact raw text of the inputs and outputs. DO NOT add variable names (like "T = 1"), array brackets (like "[1, 2]"), or commas if they were not in the original text. For platforms like CodeChef and Codeforces, the user's code reads raw whitespace-separated text (e.g. "1\\n4\\n2 3 4 5"), so changing it to "T = 1, N = 4, arr = [2, 3, 4, 5]" will completely break the execution! Leave the raw input data exactly as it was.
4. ADD EXPLANATIONS: If the original description contains example inputs and outputs but LACKS an explanation, you MUST figure out the problem logic and write a concise, helpful "Explanation:" block for each example.
5. PRESERVE MATH: If the original text contains LaTeX or MathJax formulas (like $x$ or $$y$$ or \\(z\\)), PRESERVE them exactly as they are.
6. CONSTRAINTS: Format constraints in a bulleted list <ul> under a <strong>Constraints:</strong> heading at the very bottom.
`;

  try {
    const response = await getAI().models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        systemInstruction,
        `RAW HTML TO ENHANCE:\n\n${htmlContent}`
      ],
      config: {
        temperature: 0.2
      }
    });

    let text = response.text || "";
    
    // Clean markdown if AI accidentally included it
    if (text.startsWith("\`\`\`html")) {
      text = text.replace(/^\`\`\`html\n/, "").replace(/\n\`\`\`$/, "");
    } else if (text.startsWith("\`\`\`")) {
      text = text.replace(/^\`\`\`\n/, "").replace(/\n\`\`\`$/, "");
    }

    return text.trim();
  } catch (error) {
    console.error("[aiService] Error enhancing problem description:", error.message);
    // Fallback to original if AI fails
    return htmlContent;
  }
}

module.exports = {
  generateExecutionEngine,
  generateGlobalHints,
  generatePersonalizedHint,
  generateConceptGuide,
  enhanceProblemDescription
};
