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

    // Base64-encode inputs to avoid UTF-8 conversion errors
    const b64 = (str) => Buffer.from(str || "").toString("base64");
    const dec = (str) => str ? Buffer.from(str, "base64").toString("utf-8") : null;

    const response = await axios.post(
      `${judge0Url}/submissions?base64_encoded=true&wait=true`,
      {
        source_code: b64(executionCode),
        stdin: b64(input || ""),
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

    res.json({
      stdout: decodedStdout || null,
      stderr: decodedStderr || null,
      compile_output: decodedCompile || null,
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
