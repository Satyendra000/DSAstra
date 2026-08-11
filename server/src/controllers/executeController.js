const axios = require("axios");
const Problem = require("../models/Problem");

const LANGUAGE_IDS = {
  cpp: 54,
  c: 50,
  python: 71,
  java: 62,
  javascript: 63,
};

exports.executeCode = async (req, res) => {
  try {
    const { code, input, language = "cpp", problemId } = req.body;
    const language_id = LANGUAGE_IDS[language] || 54;

    let executionCode = code;

    // --- LEETCODE ENGINE V1 (Run Mode) ---
    // Safely look up driver code — a bad ID must never crash execution
    if (problemId) {
      console.log("[Execute] Received request for problemId:", problemId, "language:", language);
      try {
        const mongoose = require("mongoose");
        const isObjectId = mongoose.isValidObjectId(problemId);
        const problem = isObjectId
          ? await Problem.findById(problemId)
          : await Problem.findOne({ problemId });

        if (problem) {
          console.log("[Execute] Found problem:", problem.title, "Platform:", problem.platform);
          if (problem.driverCode && problem.driverCode[language]) {
            console.log("[Execute] Found driverCode for language:", language);
            if (problem.driverCode[language].includes("${USER_CODE_PLACEHOLDER}")) {
              executionCode = problem.driverCode[language].replace("${USER_CODE_PLACEHOLDER}", code);
              console.log("[Execute] Injected driver code for:", problem.title);
            } else {
              console.warn("[Execute] Driver code found but is missing the ${USER_CODE_PLACEHOLDER} token!");
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
            console.warn("[Execute] No driverCode found for language:", language, "(problem.driverCode keys:", problem.driverCode ? Object.keys(problem.driverCode) : 'undefined', ")");
          }
        } else {
          console.warn("[Execute] Problem not found in database for ID/problemId:", problemId);
        }
      } catch (lookupErr) {
        console.warn("[Execute] Driver code lookup failed:", lookupErr.message);
      }
    } else {
      console.warn("[Execute] No problemId received in request body!");
    }
    // -------------------------------------

    const judge0Url = process.env.JUDGE0_API_URL || "http://localhost:2358";

    // Convert LeetCode bracket-format inputs to plain whitespace format
    // e.g. "[2,7,11,15]\n9" → "4\n2 7 11 15\n9"
    let processedInput = input || "";
    if (executionCode !== code) {
      // Driver code is active — convert bracket arrays to plain format
      processedInput = processedInput.split("\n").map(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
          const inner = trimmed.slice(1, -1).trim();
          if (inner === "") return "0\n"; // empty array
          const elements = inner.split(",").map(s => s.trim());
          return elements.length + "\n" + elements.join(" ");
        }
        return trimmed;
      }).join("\n");
    }

    // Base64-encode inputs to avoid UTF-8 conversion errors
    const b64 = (str) => Buffer.from(str || "").toString("base64");
    const dec = (str) => str ? Buffer.from(str, "base64").toString("utf-8") : null;

    const response = await axios.post(
      `${judge0Url}/submissions?base64_encoded=true&wait=true`,
      {
        source_code: b64(executionCode),
        stdin: b64(processedInput),
        language_id,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    const rawData = response.data;
    console.log("[Execute] Judge0 RAW response:", JSON.stringify(rawData));

    const { stdout, stderr, compile_output, message, status, time, memory } = rawData;

    // Decode base64 fields
    const decodedStdout = dec(stdout);
    const decodedStderr = dec(stderr);
    const decodedCompile = dec(compile_output);
    console.log("[Execute] Decoded output:", { decodedStdout, decodedStderr, decodedCompile });

    // Generate Expected Output dynamically if requested
    let dynamicExpectedOutput = null;
    if (req.body.generateExpected) {
      try {
        const mongoose = require("mongoose");
        const problem = mongoose.isValidObjectId(problemId)
          ? await Problem.findById(problemId)
          : await Problem.findOne({ problemId });

        if (problem && problem.referenceSolution && problem.driverCode?.cpp) {
          console.log("[Execute] Generating dynamic expected output using referenceSolution...");
          const refCode = problem.driverCode.cpp.replace("${USER_CODE_PLACEHOLDER}", problem.referenceSolution);
          const refResponse = await axios.post(
            `${judge0Url}/submissions?base64_encoded=true&wait=true`,
            {
              source_code: b64(refCode),
              stdin: b64(processedInput),
              language_id: 54, // Always C++ for referenceSolution
            },
            { headers: { "Content-Type": "application/json" }, timeout: 30000 }
          );
          if (refResponse.data.status.id === 3) {
            dynamicExpectedOutput = dec(refResponse.data.stdout);
            console.log("[Execute] Dynamic Expected Output generated:", dynamicExpectedOutput);
          }
        }
      } catch (e) {
        console.warn("[Execute] Failed to generate dynamic expected output:", e.message);
      }
    }

    res.json({
      stdout: decodedStdout || null,
      stderr: decodedStderr || null,
      compile_output: decodedCompile || null,
      expectedOutput: dynamicExpectedOutput || null,
      message: message || null,
      status: status?.description,
      status_id: status?.id,
      time,
      memory,
    });

  } catch (error) {
    // Log full detail to server console
    if (error.response) {
      console.error("[Execute] Judge0 error:", error.response.status, JSON.stringify(error.response.data));
      return res.status(500).json({
        error: `Judge0 API error ${error.response.status}`,
        detail: error.response.data,
      });
    }
    console.error("[Execute] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};
