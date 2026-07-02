const axios = require("axios");
const Problem = require("../models/Problem");
const Submission = require("../models/Submission");
const User = require("../models/User");

const LANGUAGE_IDS = {
  cpp: 54,
  c: 50,
  python: 71,
  java: 62,
  javascript: 63,
};

exports.submitCode = async (req, res) => {
  try {
    const { code, language = "cpp", problemId } = req.body;
    const language_id = LANGUAGE_IDS[language] || 54;
    // Clerk middleware normally puts the auth object in req.auth
    const userId = req.auth ? req.auth.userId : null;

    if (!problemId) {
      return res.status(400).json({ error: "Missing problemId" });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) return res.status(404).json({ error: "Problem not found" });

    // Parse test cases from request or fallback to problem definition
    let testCases = req.body.testCases && req.body.testCases.length > 0 ? req.body.testCases : [];
    
    if (testCases.length === 0 && problem.examples) {
      try {
        if (typeof problem.examples === "string") {
          testCases = JSON.parse(problem.examples);
        } else if (Array.isArray(problem.examples)) {
          testCases = problem.examples;
        }
      } catch (e) {
        console.warn("Failed to parse examples for problem", problemId);
      }
    }

    // Fallback if no test cases defined
    if (testCases.length === 0) {
      testCases = [{ input: "", output: "" }];
    }

    const judge0Url = process.env.JUDGE0_API_URL || "http://localhost:2358";

    let finalStatus = "Accepted";
    let maxTime = 0;
    let maxMemory = 0;
    let failedTestCase = null;
    let errorDetails = null;
    let passedCount = 0;
    const totalTestCases = testCases.length;

    let executionCode = code;
    if (problem.driverCode && problem.driverCode[language]) {
      console.log("[Submit] Found driver code for language:", language);
      if (problem.driverCode[language].includes("${USER_CODE_PLACEHOLDER}")) {
        executionCode = problem.driverCode[language].replace(
          "${USER_CODE_PLACEHOLDER}",
          code,
        );
        console.log("[Submit] Injected driver code successfully.");
      } else {
        console.warn("[Submit] Driver code is missing the ${USER_CODE_PLACEHOLDER} placeholder!");
        // Fallback: Try to extract main() from driverCode
        if (language === 'cpp') {
            if (problem.driverCode[language].includes("int main()")) {
                const mainPart = problem.driverCode[language].substring(problem.driverCode[language].indexOf("int main()"));
                executionCode = "#include <bits/stdc++.h>\nusing namespace std;\n\n" + code + "\n\n" + mainPart;
            } else {
                executionCode = "#include <bits/stdc++.h>\nusing namespace std;\n\n" + code + "\n\nint main() { return 0; }";
            }
        }
      }
    } else {
      console.warn("[Submit] No driver code found for language:", language, "(keys:", problem.driverCode ? Object.keys(problem.driverCode) : 'undefined', ")");
    }

    // Evaluate each test case sequentially
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const stdin = (tc.input || "").trim();
      const expectedOutput = (tc.output || "").trim();

      const b64 = (str) => Buffer.from(str || "").toString("base64");
      const dec = (str) =>
        str ? Buffer.from(str, "base64").toString("utf-8") : null;

      const response = await axios.post(
        `${judge0Url}/submissions?base64_encoded=true&wait=true`,
        {
          source_code: b64(executionCode),
          stdin: b64(stdin),
          language_id,
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 30000,
        },
      );

      const { stdout, stderr, compile_output, message, status, time, memory } =
        response.data;
      // Decode base64 responses
      const decodedStdout = dec(stdout);
      const decodedStderr = dec(stderr);
      const decodedCompile = dec(compile_output);
      const status_id = status?.id;

      if (time && parseFloat(time) > maxTime) maxTime = parseFloat(time);
      if (memory && memory > maxMemory) maxMemory = memory;

      // Check for Errors (CE, RE, TLE)
      if (status_id && status_id !== 3) {
        if (status_id === 6) finalStatus = "Compilation Error";
        else if (status_id === 5) finalStatus = "Time Limit Exceeded";
        else if (status_id >= 7 && status_id <= 12)
          finalStatus = "Runtime Error";
        else finalStatus = "Internal Error";

        errorDetails =
          decodedCompile || decodedStderr || message || "Error occurred";
        break;
      }

      // Check if output matches expected (only if expected is truthy)
      if (expectedOutput) {
        const actualOutput = (decodedStdout || "").trim();
        if (actualOutput !== expectedOutput) {
          finalStatus = "Wrong Answer";
          failedTestCase = {
            testCaseNumber: i + 1,
            input: stdin,
            expected: expectedOutput,
            actual: actualOutput,
          };
          break;
        }
      }

      // This test case passed
      passedCount++;
    }

    // Save Submission with test case info
    const submission = await Submission.create({
      userId,
      problemId,
      code,
      language,
      status: finalStatus,
      executionTime: maxTime,
      memory: maxMemory,
      passedTestCases: passedCount,
      totalTestCases: totalTestCases,
    });

    // Update User Progress if Accepted
    if (finalStatus === "Accepted" && userId) {
      const user = await User.findOne({ clerkId: userId });
      if (user) {
        // Use MongoDB _id for tracking solved problems (more reliable)
        const problemIdStr = problem._id.toString();
        const alreadySolved = user.solvedProblems.find(
          (p) =>
            p.problemId === problemIdStr || p.problemId === problem.problemId,
        );
        if (!alreadySolved) {
          user.solvedProblems.push({
            problemId: problemIdStr,
            platform: problem.platform || "LeetCode",
            solvedAt: new Date(),
          });
          await user.save();
        }
      }
    }

    res.json({
      submissionId: submission._id,
      status: finalStatus,
      time: maxTime,
      memory: maxMemory,
      passedTestCases: passedCount,
      totalTestCases: totalTestCases,
      failedTestCase,
      errorDetails,
    });
  } catch (error) {
    console.error("[Submit] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// Get submission history for a problem
exports.getSubmissions = async (req, res) => {
  try {
    const { problemId } = req.params;
    const userId = req.auth ? req.auth.userId : null;

    if (!userId) {
      return res.json({ submissions: [] });
    }

    const submissions = await Submission.find({
      problemId,
      userId,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .select(
        "status language executionTime memory passedTestCases totalTestCases createdAt code",
      );

    res.json({ submissions });
  } catch (error) {
    console.error("[GetSubmissions] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// Get a single submission with code
exports.getSubmissionById = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.auth ? req.auth.userId : null;

    const submission = await Submission.findById(submissionId);

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    // Only return code if it's the user's submission
    if (submission.userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ submission });
  } catch (error) {
    console.error("[GetSubmissionById] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};
