import MonacoEditor from "@monaco-editor/react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useUser, UserButton } from "@clerk/clerk-react";
import api from "../services/api";
import { marked } from "marked";

/* ─── Constants ─────────────────────────────────────────────── */
const LANG_MAP = {
  cpp: {
    id: "cpp",
    label: "C++",
    icon: "code",
    template: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}`,
  },
  python: {
    id: "python",
    label: "Python",
    icon: "code",
    template: `# Solution\n\n`,
  },
  java: {
    id: "java",
    label: "Java",
    icon: "code",
    template: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        \n    }\n}`,
  },
  javascript: {
    id: "javascript",
    label: "JavaScript",
    icon: "code",
    template: `// Solution\n\n`,
  },
  c: {
    id: "c",
    label: "C",
    icon: "code",
    template: `#include <stdio.h>\n\nint main() {\n    \n    return 0;\n}`,
  },
};

const DIFF_COLORS = {
  Easy: "text-emerald bg-emerald/10 border-emerald/15",
  Medium: "text-amber bg-amber/10 border-amber/15",
  Hard: "text-rose bg-rose/10 border-rose/15",
};

/* ─── MathJax (singleton) ──────────────────────────────────── */
let mathJaxReady = null;
function loadMathJax() {
  if (mathJaxReady) return mathJaxReady;
  mathJaxReady = new Promise((resolve) => {
    if (window.MathJax?.typesetPromise) {
      resolve();
      return;
    }
    window.MathJax = {
      tex: {
        inlineMath: [
          ["$", "$"],
          ["\\(", "\\)"],
        ],
        displayMath: [
          ["$$", "$$"],
          ["\\[", "\\]"],
        ],
      },
      options: {
        skipHtmlTags: [
          "script",
          "noscript",
          "style",
          "textarea",
          "pre",
          "code",
        ],
      },
      startup: { typeset: false },
    };
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js";
    s.async = true;
    s.onload = () => {
      const poll = () =>
        window.MathJax?.typesetPromise ? resolve() : setTimeout(poll, 100);
      poll();
    };
    document.head.appendChild(s);
  });
  return mathJaxReady;
}

/* ─── Draggable Divider Hook ───────────────────────────────── */
function useDraggable(initial, min, max, dir = "horizontal") {
  const [size, setSize] = useState(initial);
  const dragging = useRef(false);
  const startPos = useRef(0);
  const startSize = useRef(0);

  const onMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      dragging.current = true;
      startPos.current = dir === "horizontal" ? e.clientX : e.clientY;
      startSize.current = size;
      document.body.style.cursor =
        dir === "horizontal" ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";

      const onMove = (ev) => {
        if (!dragging.current) return;
        const delta =
          dir === "horizontal"
            ? ev.clientX - startPos.current
            : ev.clientY - startPos.current;
        const next =
          dir === "horizontal"
            ? startSize.current + delta
            : startSize.current - delta; // inverted for bottom panel
        setSize(Math.max(min, Math.min(max, next)));
      };
      const onUp = () => {
        dragging.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [size, min, max, dir],
  );

  return [size, onMouseDown, setSize];
}

/* ─── Inline Styles for Problem HTML ───────────────────────── */
const PROBLEM_CSS = `
  .problem-html { color: #d4d4d8; font-size: 13.5px; line-height: 1.75; word-wrap: break-word; font-family: 'Inter', system-ui, sans-serif; }
  .problem-html p { margin: 0.6em 0; }
  .problem-html pre, .problem-html .input, .problem-html .output, .problem-html .example-block {
    background: #0a0a0e; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px;
    padding: 12px 16px; font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 12px; color: #a3e635; overflow-x: auto; margin: 0.75em 0;
  }
  .problem-html code {
    background: #111116; border: 1px solid rgba(255,255,255,0.06); padding: 1px 6px;
    border-radius: 6px; font-size: 12px; color: #a3e635; font-family: 'JetBrains Mono', monospace;
  }
  .problem-html pre code { background: none; border: none; padding: 0; }
  .problem-html strong, .problem-html b { color: #ededef; font-weight: 600; }
  .problem-html em { color: #a1a1aa; }
  .problem-html h1, .problem-html h2, .problem-html h3 { color: #ededef; font-weight: 600; margin: 1.2em 0 0.5em; }
  .problem-html h1 { font-size: 16px; } .problem-html h2 { font-size: 14px; } .problem-html h3 { font-size: 13px; color: #a1a1aa; }
  .problem-html ul, .problem-html ol { padding-left: 1.5em; margin: 0.5em 0; }
  .problem-html li { margin: 0.3em 0; }
  .problem-html li::marker { color: #52525b; }
  .problem-html table { border-collapse: collapse; width: 100%; font-size: 12px; margin: 0.75em 0; }
  .problem-html th { background: #111116; color: #ededef; padding: 8px 12px; border: 1px solid rgba(255,255,255,0.07); font-weight: 600; }
  .problem-html td { padding: 6px 12px; border: 1px solid rgba(255,255,255,0.07); }
  .problem-html a { color: #60a5fa; text-decoration: underline; text-underline-offset: 2px; }
  .problem-html img { display: none; }
  .problem-html .section-title { color: #ededef; font-weight: 600; font-size: 14px; margin-top: 1.2em; margin-bottom: 0.4em; text-transform: capitalize; }
  .problem-html .note { background: #0f1624; border-left: 3px solid #60a5fa; padding: 10px 14px; border-radius: 0 8px 8px 0; margin: 0.75em 0; }
  .problem-html .note p:first-child { margin-top: 0; }
  .problem-html .note p:last-child { margin-bottom: 0; }
  .problem-html .MathJax { color: #e4e4e7 !important; }

  /* ─── Shimmer Animation ─── */
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  .shimmer-bg {
    position: relative; overflow: hidden; background-color: #111116; border-radius: 8px;
  }
  .shimmer-bg::after {
    content: ''; position: absolute; top: 0; right: 0; bottom: 0; left: 0;
    transform: translateX(-100%);
    background-image: linear-gradient(90deg, rgba(255,255,255, 0) 0, rgba(255,255,255, 0.04) 20%, rgba(255,255,255, 0.08) 60%, rgba(255,255,255, 0));
    animation: shimmer 2s infinite;
  }
`;

function ProblemSkeleton() {
  return (
    <div className="space-y-5 p-5 animate-pulse">
      {/* Title skeleton */}
      <div>
        <div className="h-7 w-3/4 shimmer-bg rounded-md mb-3" />
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 shimmer-bg" />
          <div className="h-5 w-20 shimmer-bg" />
          <div className="h-5 w-20 shimmer-bg" />
        </div>
      </div>
      <div className="border-t border-[#1e1e21]" />
      {/* Description skeleton */}
      <DescriptionSkeleton />
    </div>
  );
}

function DescriptionSkeleton() {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <div className="h-4 w-full shimmer-bg" />
        <div className="h-4 w-[90%] shimmer-bg" />
        <div className="h-4 w-[95%] shimmer-bg" />
        <div className="h-4 w-[80%] shimmer-bg" />
      </div>
      <div className="h-32 w-full shimmer-bg rounded-lg my-6" />
      <div className="space-y-2">
        <div className="h-4 w-[85%] shimmer-bg" />
        <div className="h-4 w-full shimmer-bg" />
        <div className="h-4 w-[75%] shimmer-bg" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EDITOR PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoaded, user } = useUser();
  const descRef = useRef(null);

  /* ─── State ──────────────────────────────── */
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState(LANG_MAP.cpp.template);
  const [testCases, setTestCases] = useState([{ id: 1, input: "" }]);
  const [activeTestCaseId, setActiveTestCaseId] = useState(1);
  const [testResults, setTestResults] = useState({});
  const [execResult, setExecResult] = useState(null);
  const [execInfo, setExecInfo] = useState(null);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("input");
  const [leftTab, setLeftTab] = useState("description");
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [hasLoadedPastCode, setHasLoadedPastCode] = useState(false);

  /* ─── Restored Features State ──────────────── */
  const [showTags, setShowTags] = useState(false);

  /* ─── Gamification Focus Mode ──────────────── */
  const [focusModeEnabled, setFocusModeEnabled] = useState(false);
  const [focusTimeElapsed, setFocusTimeElapsed] = useState(0); // in seconds
  const [hasOpenedHint, setHasOpenedHint] = useState(false);
  const [showFocusModal, setShowFocusModal] = useState(false);
  // Unlock 1 hint every 18 minutes (1080 seconds)
  const unlockedHintsCount = Math.floor(focusTimeElapsed / 1080);

  const [conceptGuide, setConceptGuide] = useState(null);
  const [fetchingGuide, setFetchingGuide] = useState(false);
  const [hasFetchedGuide, setHasFetchedGuide] = useState(false);
  const [generatingHints, setGeneratingHints] = useState(false);
  const [personalizedHint, setPersonalizedHint] = useState(null);
  const [generatingPersonalized, setGeneratingPersonalized] = useState(false);
  const [initializingEngine, setInitializingEngine] = useState(false);

  const initializeEngine = async () => {
    try {
      setInitializingEngine(true);
      const fetchId = problem._id || problem.problemId || id;
      await api.post(`/api/problems/${fetchId}/generate-engine`);
      
      // Fetch the completely updated problem
      const updatedRes = await api.get(`/api/problems/${fetchId}`);
      if (updatedRes.data) {
        setProblem(updatedRes.data);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to initialize execution engine.");
    } finally {
      setInitializingEngine(false);
    }
  };

  /* ─── Panel sizing ───────────────────────── */
  const [leftW, onDragLeft] = useDraggable(440, 280, 700, "horizontal");
  const [ioH, onDragIO] = useDraggable(200, 100, 500, "vertical");

  /* ─── Fetch Submissions ───────────────────── */
  const fetchSubmissions = useCallback(async () => {
    const fetchId = problem?._id || problem?.problemId || id;
    if (!fetchId) return [];
    try {
      setLoadingSubmissions(true);
      const res = await api.get(`/api/submissions/problem/${fetchId}`);
      const subs = res.data.submissions || [];
      setSubmissions(subs);
      return subs;
    } catch (err) {
      console.warn("Failed to fetch submissions:", err.message);
      return [];
    } finally {
      setLoadingSubmissions(false);
    }
  }, [id, problem]);

  // Fetch submissions on load to show Solved badge and restore code
  useEffect(() => {
    if (problem && !hasLoadedPastCode) {
      fetchSubmissions().then((subs) => {
        if (subs && subs.length > 0) {
          const lastSub = subs[0]; // Most recent submission
          if (lastSub.code) {
            setCode(lastSub.code);
            if (lastSub.language) setLanguage(lastSub.language);
          }
        }
        setHasLoadedPastCode(true);
      });
    } else if (leftTab === "submissions" && submissions.length === 0 && hasLoadedPastCode) {
      fetchSubmissions();
    }
  }, [problem, leftTab, fetchSubmissions, submissions.length, hasLoadedPastCode]);

  /* ─── MathJax ────────────────────────────── */
  const typesetMath = useCallback(() => {
    if (!descRef.current) return;
    loadMathJax().then(() => {
      window.MathJax.typesetClear([descRef.current]);
      window.MathJax.typesetPromise([descRef.current]).catch(() => {});
    });
  }, []);

  useEffect(() => {
    if (problem?.description) {
      const t = setTimeout(typesetMath, 200);
      return () => clearTimeout(t);
    }
  }, [problem?.description, typesetMath]);

  /* ─── Memoized HTML ──────────────────────── */
  const descriptionHtml = useMemo(
    () => ({ __html: problem?.description || "" }),
    [problem?.description],
  );

  const parsedExamples = useMemo(() => {
    try {
      if (problem?.examples) {
        if (
          typeof problem.examples === "string" &&
          problem.examples.startsWith("[")
        )
          return JSON.parse(problem.examples);
        if (Array.isArray(problem.examples) && problem.examples.length > 0) 
          return problem.examples;
      }
    } catch {}

    // Fallback: Extract from HTML description (LeetCode / CodeChef format)
    if (problem?.description) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(problem.description, "text/html");
        const results = [];

        // 1. LeetCode style: <pre>Input: ... Output: ...</pre> or <div class="example-block">
        const pres = doc.querySelectorAll("pre, .example-block");
        pres.forEach((pre) => {
          const text = pre.textContent || "";
          if (text.includes("Input:") && text.includes("Output:")) {
            const match = text.match(/Input:\s*([\s\S]*?)\s*Output:/i);
            const outputMatch = text.match(/Output:\s*([\s\S]*?)(?:\n\s*Explanation:|$)/i);
            
            if (match && match[1]) {
              let rawInput = match[1].trim();
              
              // Clean up LeetCode variable assignments (e.g. s = "Hello", k = 3)
              if (rawInput.includes("=")) {
                // Remove variable names
                rawInput = rawInput.replace(/\b[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*/g, '');
                // Replace commas separating arguments with newlines
                rawInput = rawInput.replace(/, (?=["\[\d\-])/g, '\n');
              }
              
              // Remove surrounding quotes for raw C++ stdin parsing
              rawInput = rawInput.split('\n').map(line => {
                line = line.trim();
                if (line.startsWith('"') && line.endsWith('"')) {
                  return line.slice(1, -1);
                }
                return line;
              }).join('\n');

              results.push({
                input: rawInput,
                output: outputMatch ? outputMatch[1].trim() : "",
              });
            }
          }
        });

        // 2. CodeChef style: <h3>Sample Input X</h3> <pre>...</pre>
        if (results.length === 0) {
          const headers = Array.from(doc.querySelectorAll("h3, h2, h4, b, strong"));
          headers.forEach((h) => {
            if (h.textContent.toLowerCase().includes("input")) {
              let next = h.nextElementSibling;
              while (
                next &&
                next.tagName !== "PRE" &&
                !["H2", "H3", "H4"].includes(next.tagName)
              ) {
                next = next.nextElementSibling;
              }
              if (next && next.tagName === "PRE") {
                results.push({
                  input: (next.textContent || "").trim(),
                  output: "",
                });
              }
            }
          });
        }

        // Deduplicate
        const unique = [];
        const seen = new Set();
        for (const r of results) {
          if (!seen.has(r.input)) {
            seen.add(r.input);
            unique.push(r);
          }
        }

        return unique;
      } catch (e) {
        return [];
      }
    }

    return [];
  }, [problem?.examples, problem?.description]);

  // Initialize test cases from parsed examples
  useEffect(() => {
    if (parsedExamples && parsedExamples.length > 0) {
      setTestCases(
        parsedExamples.map((ex, i) => ({
          id: i + 1,
          input: ex.input,
          expectedOutput: ex.output,
        }))
      );
      setActiveTestCaseId(1);
    } else {
      setTestCases([{ id: 1, input: "" }]);
      setActiveTestCaseId(1);
    }
  }, [parsedExamples]);

  /* ─── Fetch ──────────────────────────────── */
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setHasFetchedGuide(false);
    setConceptGuide(null);
    setPersonalizedHint(null);
    setShowTags(false);
    
    (async () => {
      try {
        const res = await api.get(`/api/problems/${id}`);
        setProblem(res.data);

        // Set initial code based on problem's defaultCode or fallback to template
        if (res.data.defaultCode && res.data.defaultCode[language]) {
          setCode(res.data.defaultCode[language]);
        } else {
          setCode(LANG_MAP[language].template);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, [id]); // Only fetch on id change, not language change

  // Handle language switch - use problem's defaultCode if available
  const handleLang = (l) => {
    setLanguage(l);
    if (problem?.defaultCode && problem.defaultCode[l]) {
      setCode(problem.defaultCode[l]);
    } else {
      setCode(LANG_MAP[l].template);
    }
  };

  const runCode = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      setRunning(true);
      setTestResults({});
      setExecResult(null);
      setExecInfo(null);
      setActiveTab("output");

      const promises = testCases.map(async (tc) => {
        try {
          const needsExpected = !tc.expectedOutput;
          const r = await api.post("/api/execute", {
            code,
            input: tc.input,
            language,
            problemId: problem?._id || problem?.problemId || id,
            generateExpected: needsExpected
          });
          
          const {
            stdout,
            stderr,
            compile_output,
            message,
            status,
            status_id,
            time,
            memory,
            expectedOutput: dynExpectedOutput
          } = r.data;

          const decodedStdout = (stdout || "").trim();
          let resObj = {};

          if (status_id === 6) {
            resObj = {
              type: "compile_error",
              title: "Compilation Error",
              body: compile_output || message || "Unknown compilation error",
            };
          } else if (status_id === 5) {
            resObj = {
              type: "tle",
              title: "Time Limit Exceeded",
              body: stderr || message || "Your code took too long to execute.",
            };
          } else if (status_id >= 7 && status_id <= 12) {
            resObj = {
              type: "runtime_error",
              title: `Runtime Error (${status || "NZEC"})`,
              body: stderr || message || "A runtime error occurred.",
            };
          } else if (status_id === 3) {
            const finalExpected = tc.expectedOutput || dynExpectedOutput;
            let type = "success";
            
            if (finalExpected) {
              const normalize = (s) => {
                let norm = (s || "").replace(/\r\n/g, "\n").trim().split("\n").map(l => l.trim()).join("\n");
                if (norm.startsWith('"') && norm.endsWith('"')) {
                  norm = norm.slice(1, -1);
                }
                return norm;
              };
              if (normalize(decodedStdout) === normalize(finalExpected)) {
                type = "success";
              } else {
                type = "wrong_answer";
              }
            } else {
              type = "executed";
            }
            
            resObj = {
              type,
              title: type === "success" ? "Accepted" : type === "executed" ? "Executed" : "Wrong Answer",
              body: decodedStdout || "(no output)",
              expectedOutput: finalExpected
            };
          } else {
            resObj = {
              type: "error",
              title: status || "Error",
              body: stderr || compile_output || message || "An unknown error occurred.",
            };
          }
          return { id: tc.id, result: resObj, info: { time, memory, status_id, status } };
        } catch (err) {
          const d = err.response?.data?.detail || err.response?.data?.error || err.message;
          return {
            id: tc.id,
            result: {
              type: "error",
              title: "Network Error",
              body: typeof d === "string" ? d : JSON.stringify(d, null, 2),
            },
          };
        }
      });

      const resultsArray = await Promise.all(promises);
      const newResults = {};
      resultsArray.forEach((r) => {
        newResults[r.id] = r.result;
      });
      setTestResults(newResults);

      // We can set global execInfo based on the first testcase for now (or a summary)
      if (resultsArray.length > 0 && resultsArray[0].info) {
        setExecInfo({
          status: resultsArray.some(r => r.result.type !== "success" && r.result.type !== "executed") ? "Failed" : "Accepted",
          time: resultsArray[0].info.time,
          memory: resultsArray[0].info.memory,
        });
      }

    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  const submitCode = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      setSubmitting(true);
      setExecResult(null);
      setTestResults({});
      setExecInfo(null);
      setActiveTab("output");
      const r = await api.post("/api/submissions", {
        code,
        language,
        problemId: problem._id || problem.problemId || id,
        testCases: parsedExamples,
        focusModeEnabled,
        hasOpenedHint,
      });
      const {
        status,
        time,
        memory,
        failedTestCase,
        errorDetails,
        submissionId,
        passedTestCases,
        totalTestCases,
      } = r.data;

      setExecInfo({ status, time, memory, passedTestCases, totalTestCases });
      
      // Refresh submission history after submit
      fetchSubmissions();

      if (status === "Accepted") {
        setExecResult({
          type: "success",
          title: "Accepted",
          body: `All ${totalTestCases} test cases passed!`,
        });
      } else if (status === "Wrong Answer") {
        const tcInfo = `Test Cases: ${passedTestCases}/${totalTestCases} passed\n\n`;
        const body = failedTestCase
          ? `${tcInfo}Failed on Test Case #${failedTestCase.testCaseNumber}:\n\nInput:\n${failedTestCase.input}\n\nExpected:\n${failedTestCase.expected}\n\nActual:\n${failedTestCase.actual}`
          : `${tcInfo}Output did not match expected.`;
        setExecResult({ type: "error", title: "Wrong Answer", body });
      } else if (status === "Compilation Error") {
        setExecResult({
          type: "compile_error",
          title: "Compilation Error",
          body: errorDetails || "Unknown compilation error",
        });
      } else if (status === "Time Limit Exceeded") {
        const tcInfo = passedTestCases > 0 ? `${passedTestCases}/${totalTestCases} test cases passed before TLE.\n\n` : '';
        setExecResult({
          type: "tle",
          title: "Time Limit Exceeded",
          body: tcInfo + (errorDetails || "Your code took too long to execute."),
        });
      } else if (status === "Runtime Error") {
        const tcInfo = passedTestCases > 0 ? `${passedTestCases}/${totalTestCases} test cases passed before error.\n\n` : '';
        setExecResult({
          type: "runtime_error",
          title: "Runtime Error",
          body: tcInfo + (errorDetails || "A runtime error occurred."),
        });
      } else {
        setExecResult({
          type: "error",
          title: status || "Error",
          body: errorDetails || "An unknown error occurred.",
        });
      }
    } catch (err) {
      const d =
        err.response?.data?.detail || err.response?.data?.error || err.message;
      setExecResult({
        type: "error",
        title: "Network Error",
        body: typeof d === "string" ? d : JSON.stringify(d, null, 2),
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Restored Features API Calls ────────── */


  const generateGlobalHints = async () => {
    if (!problem) return;
    setGeneratingHints(true);
    try {
      const res = await api.get(`/api/problems/${problem._id || problem.problemId || id}/global-hints`);
      setProblem(p => ({ ...p, hints: res.data.hints }));
    } catch (err) {
      console.error("Failed to generate global hints:", err);
    } finally {
      setGeneratingHints(false);
    }
  };

  const generatePersonalizedHint = async () => {
    if (!problem || !code) return;
    setGeneratingPersonalized(true);
    try {
      const res = await api.post(`/api/problems/${problem._id || problem.problemId || id}/personalized-hint`, { 
        code, 
        language 
      });
      setPersonalizedHint(res.data.hint);
    } catch (err) {
      console.error("Failed to get personalized hint:", err);
      setPersonalizedHint("Sorry, failed to generate hint.");
    } finally {
      setGeneratingPersonalized(false);
    }
  };

  /* ─── Timer ──────────────────────────────── */
  const [elapsed, setElapsed] = useState(0);
  const [timerOn, setTimerOn] = useState(false);
  useEffect(() => {
    if (!timerOn) return;
    const id = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(id);
  }, [timerOn]);

  useEffect(() => {
    if (!focusModeEnabled) return;
    const id = setInterval(() => setFocusTimeElapsed((p) => p + 1), 1000);
    return () => clearInterval(id);
  }, [focusModeEnabled]);

  const fmtTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  /* ════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════ */
  return (
    <div
      className="h-screen flex flex-col bg-bg-deep text-text-primary overflow-hidden"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <style>{PROBLEM_CSS}</style>

      {/* ═══ TOOLBAR ═══════════════════════════════════════════ */}
      <div className="h-12 bg-bg-elevated border-b border-border flex items-center px-3 gap-2 shrink-0">
        {/* Left cluster */}
        {!focusModeEnabled && (
          <Link
            to="/problems"
            className="flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors duration-200 px-2 py-1 rounded-lg hover:bg-white/[0.04]"
          >
            <span className="material-symbols-outlined text-[16px]">
              chevron_left
            </span>
            <span className="text-[12px] font-medium hidden sm:inline">
              Problem List
            </span>
          </Link>
        )}

        {!focusModeEnabled && <div className="w-px h-5 bg-border mx-1" />}

        {problem && (
          <div className="flex items-center gap-2 min-w-0">
            {problem.difficulty && (
              <span
                className={`text-[9px] font-bold px-1.5 py-[2px] rounded uppercase tracking-wider ${DIFF_COLORS[problem.difficulty] || ""}`}
              >
                {problem.difficulty}
              </span>
            )}
            <span className="text-[13px] font-semibold text-text-primary truncate max-w-[200px]">
              {problem.title}
            </span>
          </div>
        )}

        <div className="flex-1" />

        {/* Timer */}
        <div className="flex items-center gap-1 mr-1">
          <button
            onClick={() => setTimerOn(!timerOn)}
            className="p-1 rounded-lg hover:bg-white/[0.05] text-text-secondary hover:text-text-primary transition-colors duration-200"
          >
            <span className="material-symbols-outlined text-[16px]">
              {timerOn ? "pause" : "timer"}
            </span>
          </button>
          <span className="text-[11px] font-mono text-text-secondary w-10 tabular-nums">
            {fmtTime(elapsed)}
          </span>
          {elapsed > 0 && (
            <button
              onClick={() => {
                setElapsed(0);
                setTimerOn(false);
              }}
              className="p-0.5 rounded-lg hover:bg-white/[0.05] text-text-tertiary hover:text-text-secondary transition-colors duration-200"
            >
              <span className="material-symbols-outlined text-[13px]">
                restart_alt
              </span>
            </button>
          )}
        </div>

        <div className="w-px h-5 bg-border" />

        {/* Language */}
        <select
          value={language}
          onChange={(e) => handleLang(e.target.value)}
          className="bg-bg-hover text-text-secondary text-[11px] pl-2 pr-6 py-1.5 rounded-xl border border-border focus:outline-none focus:border-accent/40 font-medium appearance-none cursor-pointer transition-colors duration-200"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%2371717a' viewBox='0 0 20 20'%3E%3Cpath d='M5.3 7.7a1 1 0 011.4 0L10 11l3.3-3.3a1 1 0 111.4 1.4l-4 4a1 1 0 01-1.4 0l-4-4a1 1 0 010-1.4z'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 4px center",
            backgroundSize: "14px",
          }}
        >
          {Object.entries(LANG_MAP).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>

        {/* Focus Mode Button */}
        <button
          onClick={() => {
            if (focusModeEnabled) {
              setFocusModeEnabled(false);
              setFocusTimeElapsed(0);
            } else {
              setShowFocusModal(true);
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all duration-200 shadow-sm border ${
            focusModeEnabled 
              ? 'bg-rose-500 text-white border-rose-500 shadow-rose-500/20 hover:bg-rose-600' 
              : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">
            {focusModeEnabled ? 'close_fullscreen' : 'center_focus_strong'}
          </span>
          {focusModeEnabled ? 'Exit Focus Mode' : 'Focus Mode'}
        </button>

        {problem?.platform === 'LeetCode' && (!problem.driverCode || !problem.driverCode.cpp) ? (
          <button
            onClick={initializeEngine}
            disabled={initializingEngine}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 disabled:opacity-40 text-white text-[11px] font-semibold px-3.5 py-1.5 rounded-xl transition-all duration-200 shadow-sm shadow-purple-500/20"
          >
            <span className={`material-symbols-outlined text-[14px] ${initializingEngine ? 'animate-spin' : ''}`}>
              {initializingEngine ? 'sync' : 'smart_toy'}
            </span>
            {initializingEngine ? 'Initializing...' : 'Initialize Engine'}
          </button>
        ) : (
          <>
            {/* Run */}
            <button
              onClick={runCode}
              disabled={running || submitting}
              className="flex items-center gap-1.5 bg-bg-hover hover:bg-bg-active active:bg-white/[0.1] disabled:opacity-40 text-text-secondary text-[11px] font-semibold px-3.5 py-1.5 rounded-xl border border-border transition-all duration-200"
            >
              {running ? (
                <>
                  <span className="material-symbols-outlined text-[14px] animate-spin">
                    progress_activity
                  </span>
                  Running
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[14px]">
                    play_arrow
                  </span>
                  Run
                </>
              )}
            </button>

            {/* Submit */}
            <button
              onClick={submitCode}
              disabled={running || submitting}
              className="flex items-center gap-1.5 bg-emerald/90 hover:bg-emerald active:bg-emerald/80 disabled:opacity-40 text-black text-[11px] font-semibold px-3.5 py-1.5 rounded-xl transition-all duration-200 shadow-sm shadow-emerald/20"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined text-[14px] animate-spin">
                    progress_activity
                  </span>
                  Submitting
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[14px]">
                    cloud_upload
                  </span>
                  Submit
                </>
              )}
            </button>
          </>
        )}

        {/* Open Original */}
        {problem?.url && (
          <a
            href={problem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded hover:bg-white/[0.05] text-zinc-600 hover:text-zinc-300 transition-colors"
            title="Open on original platform"
          >
            <span className="material-symbols-outlined text-[16px]">
              open_in_new
            </span>
          </a>
        )}

        {!isLoaded ? null : !user ? (
          <Link to="/login" className="flex items-center gap-1.5 px-3 py-1 border border-accent/30 rounded-lg text-[11px] font-medium text-accent hover:bg-accent/10 transition-all duration-200 ml-1">
            Sign In
          </Link>
        ) : (
          <div className="ml-2 flex items-center justify-center">
            <UserButton afterSignOutUrl="/" appearance={{
              elements: {
                userButtonAvatarBox: "w-7 h-7"
              }
            }} />
          </div>
        )}
      </div>

      {/* ═══ MAIN CONTENT ══════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden">
        {/* ─── LEFT PANEL (Problem) ─────────────────────────── */}
        <div
          className="flex flex-col bg-[#0a0a0b] overflow-hidden"
          style={{ width: leftW, minWidth: 280 }}
        >
          {/* Tabs */}
          <div className="h-9 bg-[#111113] border-b border-[#1e1e21] flex items-center px-1 shrink-0 gap-0">
            {["description", "submissions", "editorial"].map((tab) => (
              <button
                key={tab}
                onClick={() => setLeftTab(tab)}
                className={`px-3 h-full text-[11px] font-medium capitalize transition-colors border-b-2 ${
                  leftTab === tab
                    ? "text-white border-emerald-500"
                    : "text-zinc-600 border-transparent hover:text-zinc-400"
                }`}
              >
                {tab}
              </button>
            ))}
            <div className="flex-1" />
            {problem?.platform && (
              <span className="text-[9px] font-bold px-1.5 py-[2px] mr-2 rounded bg-white/[0.04] border border-[#27272a] text-zinc-500 uppercase tracking-wider">
                {problem.platform}
              </span>
            )}
          </div>

          {/* Content */}
          <div ref={descRef} className="flex-1 overflow-y-auto custom-scroll">
            {/* Submissions tab */}
            <div
              style={{ display: leftTab === "submissions" ? "block" : "none" }}
            >
              <div className="p-4">
                <h2 className="text-sm font-semibold text-white mb-4">Submission History</h2>
                {loadingSubmissions ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-lg bg-white/[0.02] border border-[#1e1e21] animate-shimmer" />)}
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="text-zinc-500 text-xs">No submissions yet</div>
                ) : (
                  <div className="space-y-2">
                    {submissions.map((sub, idx) => (
                      <div 
                        key={sub._id || idx}
                        className="p-3 bg-[#111113] rounded-lg border border-[#1e1e21] hover:border-zinc-700 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            sub.status === 'Accepted' 
                              ? 'bg-emerald-500/20 text-emerald-400' 
                              : sub.status === 'Wrong Answer'
                              ? 'bg-red-500/20 text-red-400'
                              : sub.status === 'Time Limit Exceeded'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-zinc-500/20 text-zinc-400'
                          }`}>
                            {sub.status}
                          </span>
                          <span className="text-[10px] text-zinc-600 uppercase">
                            {sub.language}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-zinc-500">
                          {sub.passedTestCases !== undefined && sub.totalTestCases !== undefined && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">task_alt</span>
                              {sub.passedTestCases}/{sub.totalTestCases} passed
                            </span>
                          )}
                          {sub.executionTime && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">schedule</span>
                              {sub.executionTime.toFixed(3)}s
                            </span>
                          )}
                          {sub.memory && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">memory</span>
                              {(sub.memory / 1024).toFixed(1)} MB
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-600 mt-2">
                          {new Date(sub.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Description tab — always in DOM, hidden when inactive */}
            <div
              style={{ display: leftTab === "description" ? "block" : "none" }}
            >
              <div className="p-5">
                {loading ? (
                  <ProblemSkeleton />
                ) : problem ? (
                  <div className="space-y-4">
                    {/* Title + meta */}
                    <div>
                      <h1 className="text-lg font-semibold text-white tracking-tight leading-snug mb-2 flex items-center gap-3">
                        <span>
                          {problem.problemId && (
                            <span className="text-zinc-600 mr-1">
                              #{problem.problemId}
                            </span>
                          )}
                          {problem.title}
                        </span>
                        {submissions.some(s => s.status === "Accepted") && (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium select-none">
                            <span className="material-symbols-outlined text-[12px]">check_circle</span>
                            Solved
                          </span>
                        )}
                      </h1>
                      <div className="flex items-center gap-2 flex-wrap text-[10px]">
                        {problem.difficulty && (
                          <span
                            className={`font-bold px-2 py-[3px] rounded border uppercase tracking-wider ${DIFF_COLORS[problem.difficulty] || "text-zinc-400 bg-zinc-500/10 border-zinc-500/20"}`}
                          >
                            {problem.difficulty}
                          </span>
                        )}
                        {problem.meta?.timeLimit && (
                          <span className="flex items-center gap-1 text-zinc-600">
                            <span className="material-symbols-outlined text-[12px]">
                              schedule
                            </span>
                            {problem.meta.timeLimit}
                          </span>
                        )}
                        {problem.meta?.memoryLimit && (
                          <span className="flex items-center gap-1 text-zinc-600">
                            <span className="material-symbols-outlined text-[12px]">
                              memory
                            </span>
                            {problem.meta.memoryLimit}
                          </span>
                        )}
                      </div>

                    </div>

                    <div className="border-t border-[#1e1e21]" />

                    {/* Description */}
                    {problem.description ? (
                      <div
                        className="problem-html"
                        dangerouslySetInnerHTML={descriptionHtml}
                      />
                    ) : (
                      <div className="py-2">
                        <DescriptionSkeleton />
                        {problem.url && (
                          <div className="mt-4 flex">
                            <a
                              href={problem.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/[0.03] border border-[#27272a] rounded-lg text-[11px] font-medium text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                open_in_new
                              </span>
                              Read on {problem.platform} instead
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Hints */}
                    {/* Dual Hint System */}
                    {/* ─── BOTTOM SECTIONS (Hints, Code Analysis, Related Topics) ─── */}
                    <div className="mt-8 pt-6 border-t border-[#1e1e21] space-y-6">
                      
                      {/* 1. Global Hints */}
                      <div className="bg-[#111113]/50 border border-white/[0.02] rounded-xl p-4 transition-all hover:bg-[#111113]/80">
                        <h3 className="text-[13px] font-semibold text-zinc-200 flex items-center gap-2 mb-4">
                          <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                            <span className="material-symbols-outlined text-[14px] text-amber-500">lightbulb</span>
                          </div>
                          Problem Hints
                        </h3>
                        {problem.hints?.length > 0 ? (
                          <div className="space-y-2">
                            {problem.hints.map((h, i) => {
                              const isLocked = focusModeEnabled && i >= unlockedHintsCount;
                              return (
                                <details 
                                  key={i} 
                                  className={`group bg-[#0a0a0b] border border-white/[0.05] rounded-lg overflow-hidden transition-all ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:border-white/[0.1]'}`}
                                  onToggle={(e) => {
                                    if (e.target.open) {
                                      if (isLocked) {
                                        e.preventDefault();
                                        e.target.open = false;
                                        // They tried to peek, maybe show a small toast?
                                        return;
                                      }
                                      setHasOpenedHint(true);
                                    }
                                  }}
                                >
                                  <summary className={`text-[12px] font-medium text-zinc-400 flex items-center gap-2 px-3 py-2.5 select-none outline-none ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:text-zinc-200 transition-colors'}`}>
                                    <span className="material-symbols-outlined text-[16px] transition-transform duration-300 group-open:rotate-90">
                                      {isLocked ? 'lock' : 'arrow_right'}
                                    </span>
                                    Hint {i + 1}
                                    {isLocked && <span className="text-[9px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full ml-auto">Locked ({18 - Math.floor((focusTimeElapsed % 1080) / 60)}m left)</span>}
                                  </summary>
                                  <div className="px-4 py-3 text-[12px] border-t border-white/[0.05] text-zinc-300 leading-relaxed problem-html bg-white/[0.02]" dangerouslySetInnerHTML={{ __html: h }} />
                                </details>
                              );
                            })}
                          </div>
                        ) : (
                          <button
                            onClick={generateGlobalHints}
                            disabled={generatingHints}
                            className="w-full flex items-center justify-center gap-2 text-[12px] font-medium bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 hover:shadow-[0_0_15px_rgba(245,158,11,0.1)] border border-amber-500/20 px-4 py-2.5 rounded-lg transition-all duration-300 disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[16px]">{generatingHints ? 'sync' : 'auto_awesome'}</span>
                            {generatingHints ? 'Generating Insights...' : 'Reveal Hints'}
                          </button>
                        )}
                      </div>

                      {/* 2. Personalized Code Analysis */}
                      <div className="bg-[#111113]/50 border border-white/[0.02] rounded-xl p-4 transition-all hover:bg-[#111113]/80">
                        <h3 className="text-[13px] font-semibold text-zinc-200 flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <span className="material-symbols-outlined text-[14px] text-blue-400">psychology</span>
                          </div>
                          Code Analysis
                        </h3>
                        <p className="text-[12px] text-zinc-500 mb-4 ml-8 leading-relaxed">Stuck? Get a personalized, conceptual hint based on your current code architecture.</p>
                        <button
                          onClick={generatePersonalizedHint}
                          disabled={generatingPersonalized || !code}
                          className="ml-8 flex items-center justify-center gap-2 text-[12px] font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:shadow-[0_0_15px_rgba(59,130,246,0.1)] border border-blue-500/20 px-4 py-2 rounded-lg transition-all duration-300 disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[16px]">{generatingPersonalized ? 'sync' : 'troubleshoot'}</span>
                          {generatingPersonalized ? 'Analyzing Your Code...' : 'Analyze My Code'}
                        </button>
                        
                        {personalizedHint && (
                          <div className="mt-4 ml-8 p-4 bg-[#0a0a0b] border border-blue-500/20 rounded-lg shadow-sm">
                            <div className="problem-html text-[13px] text-zinc-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: marked.parse(personalizedHint) }} />
                          </div>
                        )}
                      </div>

                      {/* 3. Related Topics (Wrapper for Tags & AI Guide) */}
                      <details 
                        className="group bg-[#111113]/50 border border-white/[0.02] rounded-xl overflow-hidden transition-all hover:bg-[#111113]/80"
                        onToggle={(e) => {
                          if (e.target.open && !hasFetchedGuide) {
                            setHasFetchedGuide(true);
                            setFetchingGuide(true);
                            api.get(`/api/problems/${problem._id || problem.problemId || id}/concept-guide`)
                              .then(res => setConceptGuide(res.data.guide))
                              .catch(err => console.error("Failed to fetch guide:", err))
                              .finally(() => setFetchingGuide(false));
                          }
                        }}
                      >
                        <summary className="text-[13px] font-semibold text-zinc-200 cursor-pointer hover:text-white transition-colors flex items-center gap-2 p-4 select-none outline-none">
                          <span className="material-symbols-outlined text-[18px] text-zinc-500 group-open:rotate-90 transition-transform duration-300">
                            arrow_right
                          </span>
                          <div className="w-6 h-6 rounded-md bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                            <span className="material-symbols-outlined text-[14px] text-purple-400">
                              hub
                            </span>
                          </div>
                          Related Topics & Guide
                        </summary>
                        
                        <div className="px-4 pb-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          {/* Tags Section */}
                          {problem.tags?.length > 0 && (
                            <details className="group/tags bg-[#0a0a0b] border border-white/[0.05] rounded-lg overflow-hidden" open>
                              <summary className="text-[12px] font-medium text-zinc-400 cursor-pointer hover:text-zinc-200 hover:bg-white/[0.02] transition-colors flex items-center gap-2 px-3 py-2.5 select-none uppercase tracking-wider outline-none">
                                <span className="material-symbols-outlined text-[16px] transition-transform duration-300 group-open/tags:rotate-90">arrow_right</span>
                                Problem Tags
                              </summary>
                              <div className="flex flex-wrap gap-2 px-4 pb-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                {problem.tags.map((t, i) => (
                                  <span
                                    key={i}
                                    className="text-[11.5px] font-medium px-3 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.05] text-zinc-300 hover:bg-white/[0.06] transition-colors"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </details>
                          )}

                          {/* AI Study & Guide Section */}
                          <details className="group/guide bg-[#0a0a0b] border border-white/[0.05] rounded-lg overflow-hidden" open>
                            <summary className="text-[12px] font-medium text-zinc-400 cursor-pointer hover:text-zinc-200 hover:bg-white/[0.02] transition-colors flex items-center gap-2 px-3 py-2.5 select-none uppercase tracking-wider outline-none">
                              <span className="material-symbols-outlined text-[16px] transition-transform duration-300 group-open/guide:rotate-90">arrow_right</span>
                              <span className="material-symbols-outlined text-[14px] text-purple-400">menu_book</span>
                              AI Concept Guide
                            </summary>
                            <div className="px-4 pb-4 border-t border-white/[0.02] pt-3 animate-in fade-in slide-in-from-top-1 duration-200 bg-white/[0.01]">
                              {fetchingGuide ? (
                                <div className="space-y-4 animate-pulse">
                                  <div className="h-4 w-1/3 shimmer-bg rounded-md" />
                                  <div className="h-3 w-full shimmer-bg rounded-md" />
                                  <div className="h-3 w-5/6 shimmer-bg rounded-md" />
                                  <div className="h-24 w-full shimmer-bg rounded-xl mt-4" />
                                </div>
                              ) : conceptGuide ? (
                                <div className="problem-html text-[13px] text-zinc-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: marked.parse(conceptGuide) }} />
                              ) : (
                                <p className="text-zinc-500 text-[12px] italic">Study guide is currently unavailable for this problem.</p>
                              )}
                            </div>
                          </details>
                        </div>
                      </details>
                    </div>


                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <span className="material-symbols-outlined text-zinc-800 text-3xl mb-2">
                      error
                    </span>
                    <p className="text-zinc-600 text-[13px]">
                      Problem not found
                    </p>
                  </div>
                )}
              </div>
            </div>



            {/* Editorial tab — always in DOM, hidden when inactive */}
            <div
              style={{ display: leftTab === "editorial" ? "block" : "none" }}
            >
              <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-700">
                <span className="material-symbols-outlined text-3xl mb-2">
                  article
                </span>
                <p className="text-[13px]">Editorial coming soon</p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── VERTICAL DIVIDER (draggable) ─────────────────── */}
        <div
          onMouseDown={onDragLeft}
          className="w-[5px] shrink-0 bg-[#111113] border-x border-[#1e1e21] cursor-col-resize hover:bg-emerald-600/30 active:bg-emerald-600/50 transition-colors flex items-center justify-center group"
        >
          <div className="w-[2px] h-8 bg-[#27272a] rounded-full group-hover:bg-emerald-500/50 transition-colors" />
        </div>

        {/* ─── RIGHT PANEL (Editor + IO) ────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0d0d0f]">
          {/* ─ Code Editor ─ */}
          <div className="flex-1 min-h-0">
            <MonacoEditor
              height="100%"
              language={LANG_MAP[language].id}
              theme="vs-dark"
              value={code}
              onChange={(v) => setCode(v || "")}
              options={{
                fontSize: 14,
                fontFamily:
                  "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 8 },
                lineNumbers: "on",
                renderLineHighlight: "line",
                automaticLayout: true,
                bracketPairColorization: { enabled: true },
                smoothScrolling: true,
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
              }}
            />
          </div>

          {/* ─ HORIZONTAL DIVIDER (draggable) ─ */}
          <div
            onMouseDown={onDragIO}
            className="h-[5px] shrink-0 bg-[#111113] border-y border-[#1e1e21] cursor-row-resize hover:bg-emerald-600/30 active:bg-emerald-600/50 transition-colors flex items-center justify-center group"
          >
            <div className="h-[2px] w-8 bg-[#27272a] rounded-full group-hover:bg-emerald-500/50 transition-colors" />
          </div>

          {/* ─ Bottom I/O Panel ─ */}
          <div
            className="shrink-0 flex flex-col bg-[#111113]"
            style={{ height: ioH }}
          >
            {/* I/O Tabs */}
            <div className="h-9 flex items-center border-b border-[#1e1e21] shrink-0 px-1 gap-0">
              {["input", "output"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3.5 h-full text-[11px] font-medium capitalize transition-colors border-b-2 flex items-center gap-1.5 ${
                    activeTab === tab
                      ? "text-white border-emerald-500"
                      : "text-zinc-600 border-transparent hover:text-zinc-400"
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">
                    {tab === "input" ? "terminal" : "output"}
                  </span>
                  {tab}
                  {tab === "output" && Object.keys(testResults).length > 0 && !running && !submitting && (
                    <span
                      className={`text-[9px] font-bold px-1 py-px rounded ${
                        Object.values(testResults).every(r => r.type === "success" || r.type === "executed")
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-rose-500/15 text-rose-400"
                      }`}
                    >
                      {Object.values(testResults).every(r => r.type === "success" || r.type === "executed")
                        ? "✓"
                        : "!"}
                    </span>
                  )}
                </button>
              ))}
              <div className="flex-1" />
              {execInfo && (
                <span className="text-[10px] text-zinc-600 pr-3 font-mono tabular-nums flex items-center gap-2">
                  {execInfo.passedTestCases !== undefined && execInfo.totalTestCases !== undefined && (
                    <span className={`${execInfo.status === 'Accepted' ? 'text-emerald-500' : 'text-zinc-500'}`}>
                      {execInfo.passedTestCases}/{execInfo.totalTestCases} TC
                    </span>
                  )}
                  {execInfo.time != null && (
                    <span>
                      {parseFloat(execInfo.time).toFixed(3)}s
                    </span>
                  )}
                  {execInfo.memory != null && (
                    <span>
                      {Math.round(parseFloat(execInfo.memory))}KB
                    </span>
                  )}
                </span>
              )}
            </div>

            {/* I/O Content */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#0a0a0b]">
              
              {/* Test Case Sub-tabs (Only show if not viewing a full submission result) */}
              {!execResult && (
                <div className="flex items-center gap-1 px-2 pt-2 overflow-x-auto border-b border-[#1e1e21] shrink-0 custom-scroll">
                  {testCases.map((tc, idx) => {
                    const res = testResults[tc.id];
                    return (
                      <button
                        key={tc.id}
                        onClick={() => setActiveTestCaseId(tc.id)}
                        className={`px-3 py-1.5 text-[11.5px] font-medium rounded-t-lg transition-colors flex items-center gap-1.5 ${
                          activeTestCaseId === tc.id
                            ? "bg-[#1e1e21] text-white"
                            : "text-zinc-500 hover:text-zinc-300 hover:bg-[#1e1e21]/50"
                        }`}
                      >
                        {activeTab === "output" && res && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              res.type === "success" || res.type === "executed" ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                        )}
                        Case {idx + 1}
                      </button>
                    );
                  })}
                  {activeTab === "input" && (
                    <button
                      onClick={() => {
                        const newId = Date.now();
                        setTestCases([...testCases, { id: newId, input: "" }]);
                        setActiveTestCaseId(newId);
                      }}
                      className="px-2 py-1.5 text-zinc-500 hover:text-white transition-colors mb-0.5"
                      title="Add Test Case"
                    >
                      <span className="material-symbols-outlined text-[14px]">add</span>
                    </button>
                  )}
                </div>
              )}

              {/* Tab Content body */}
              <div className="flex-1 overflow-auto custom-scroll relative">
                {activeTab === "input" ? (
                  !execResult ? (
                    (() => {
                      const currentTestCase = testCases.find((tc) => tc.id === activeTestCaseId);
                      if (!currentTestCase) return null;

                      if (problem?.platform === "LeetCode" && problem?.metaData?.params?.length > 0) {
                        const params = problem.metaData.params;
                        const lines = currentTestCase.input.split('\n');

                        const updateParam = (idx, value) => {
                          const newLines = [...lines];
                          while (newLines.length < params.length) newLines.push("");
                          newLines[idx] = value.replace(/\n/g, ""); // LeetCode params generally don't have literal newlines in the box
                          const newInput = newLines.join('\n');
                          setTestCases(
                            testCases.map((tc) =>
                              tc.id === activeTestCaseId ? { ...tc, input: newInput } : tc
                            )
                          );
                        };

                        return (
                          <div className="w-full h-full p-4 flex flex-col gap-4 overflow-y-auto">
                            {params.map((param, idx) => (
                              <div key={idx} className="flex flex-col gap-1.5">
                                <span className="text-[12px] font-medium text-zinc-400 font-mono">
                                  {param.name} =
                                </span>
                                <div className="bg-[#1a1a1d] border border-[#27272a] rounded-lg focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all">
                                  <textarea
                                    value={lines[idx] || ""}
                                    onChange={(e) => updateParam(idx, e.target.value)}
                                    placeholder={`${param.type}`}
                                    className="w-full bg-transparent text-zinc-300 text-[13.5px] font-mono p-2.5 resize-none focus:outline-none min-h-[44px] block overflow-hidden"
                                    rows={1}
                                    style={{
                                      height: lines[idx] ? 'auto' : '44px',
                                    }}
                                    onInput={(e) => {
                                      e.target.style.height = 'auto';
                                      e.target.style.height = (e.target.scrollHeight) + 'px';
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      }

                      return (
                        <textarea
                          placeholder="Custom input (stdin)..."
                          value={currentTestCase.input}
                          onChange={(e) => {
                            setTestCases(
                              testCases.map((tc) =>
                                tc.id === activeTestCaseId
                                  ? { ...tc, input: e.target.value }
                                  : tc
                              )
                            );
                          }}
                          className="w-full h-full bg-transparent text-zinc-300 text-[13px] font-mono p-3 resize-none focus:outline-none placeholder-zinc-700/60"
                        />
                      );
                    })()
                  ) : (
                    <div className="p-3">
                      <span className="text-zinc-700/60 text-[13px] font-mono">
                        Submission result active. Switch to Output tab to view details, or clear it to edit input.
                      </span>
                    </div>
                  )
                ) : (
                  <div className="w-full h-full">
                    {running || submitting ? (
                      <div className="p-3">
                        <span className="text-zinc-600 flex items-center gap-1.5 text-[13px] font-mono">
                          <span className="material-symbols-outlined text-[14px] animate-spin">
                            progress_activity
                          </span>
                          {running
                            ? "Executing..."
                            : "Evaluating against test cases..."}
                        </span>
                      </div>
                    ) : execResult ? (
                      <div className="flex flex-col h-full">
                        {/* Error / Status Header for Submission */}
                        {execResult.type !== "success" && (
                          <div
                            className={`flex items-center gap-2 px-3 py-2 border-b shrink-0 ${
                              execResult.type === "compile_error"
                                ? "bg-rose-500/[0.06] border-rose-500/20"
                                : execResult.type === "runtime_error"
                                  ? "bg-orange-500/[0.06] border-orange-500/20"
                                  : execResult.type === "tle"
                                    ? "bg-amber-500/[0.06] border-amber-500/20"
                                    : "bg-rose-500/[0.06] border-rose-500/20"
                            }`}
                          >
                            <span
                              className={`material-symbols-outlined text-[16px] ${
                                execResult.type === "compile_error"
                                  ? "text-rose-400"
                                  : execResult.type === "runtime_error"
                                    ? "text-orange-400"
                                    : execResult.type === "tle"
                                      ? "text-amber-400"
                                      : "text-rose-400"
                              }`}
                            >
                              {execResult.type === "tle" ? "timer_off" : "error"}
                            </span>
                            <span
                              className={`text-[12px] font-semibold ${
                                execResult.type === "compile_error"
                                  ? "text-rose-400"
                                  : execResult.type === "runtime_error"
                                    ? "text-orange-400"
                                    : execResult.type === "tle"
                                      ? "text-amber-400"
                                      : "text-rose-400"
                              }`}
                            >
                              {execResult.title}
                            </span>
                          </div>
                        )}
                        {/* Output Body */}
                        <pre
                          className={`flex-1 p-3 text-[13px] font-mono whitespace-pre-wrap break-words m-0 ${
                            execResult.type === "success"
                              ? "text-emerald-400"
                              : execResult.type === "compile_error"
                                ? "text-rose-300/90"
                                : execResult.type === "runtime_error"
                                  ? "text-orange-300/90"
                                  : execResult.type === "tle"
                                    ? "text-amber-300/90"
                                    : "text-rose-300/90"
                          }`}
                        >
                          {execResult.body}
                        </pre>
                      </div>
                    ) : testResults[activeTestCaseId] ? (
                      <div className="flex flex-col h-full">
                        {/* Error / Status Header for Run Code */}
                        {testResults[activeTestCaseId].type !== "success" && testResults[activeTestCaseId].type !== "executed" && (
                          <div
                            className={`flex items-center gap-2 px-3 py-2 border-b shrink-0 ${
                              testResults[activeTestCaseId].type === "compile_error" || testResults[activeTestCaseId].type === "wrong_answer"
                                ? "bg-rose-500/[0.06] border-rose-500/20"
                                : testResults[activeTestCaseId].type === "runtime_error"
                                  ? "bg-orange-500/[0.06] border-orange-500/20"
                                  : testResults[activeTestCaseId].type === "tle"
                                    ? "bg-amber-500/[0.06] border-amber-500/20"
                                    : "bg-blue-500/[0.06] border-blue-500/20"
                            }`}
                          >
                            <span
                              className={`material-symbols-outlined text-[16px] ${
                                testResults[activeTestCaseId].type === "compile_error" || testResults[activeTestCaseId].type === "wrong_answer"
                                  ? "text-rose-400"
                                  : testResults[activeTestCaseId].type === "runtime_error"
                                    ? "text-orange-400"
                                    : testResults[activeTestCaseId].type === "tle"
                                      ? "text-amber-400"
                                      : "text-blue-400"
                              }`}
                            >
                              {testResults[activeTestCaseId].type === "tle" ? "timer_off" : testResults[activeTestCaseId].type === "wrong_answer" ? "cancel" : "error"}
                            </span>
                            <span
                              className={`text-[12px] font-semibold ${
                                testResults[activeTestCaseId].type === "compile_error" || testResults[activeTestCaseId].type === "wrong_answer"
                                  ? "text-rose-400"
                                  : testResults[activeTestCaseId].type === "runtime_error"
                                    ? "text-orange-400"
                                    : testResults[activeTestCaseId].type === "tle"
                                      ? "text-amber-400"
                                      : "text-blue-400"
                              }`}
                            >
                              {testResults[activeTestCaseId].title}
                            </span>
                          </div>
                        )}
                        {/* Output Body */}
                        <div className="flex-1 p-4 overflow-y-auto custom-scroll flex flex-col gap-5">
                          {/* Input block */}
                          {(() => {
                            const currentTestCase = testCases.find((tc) => tc.id === activeTestCaseId);
                            const rawInput = currentTestCase?.input || "";

                            if (problem?.platform === "LeetCode" && problem?.metaData?.params?.length > 0) {
                              const params = problem.metaData.params;
                              const lines = rawInput.split('\n');

                              return (
                                <div className="flex flex-col gap-3">
                                  {params.map((param, idx) => (
                                    <div key={idx} className="flex flex-col gap-1.5">
                                      <span className="text-[12px] font-medium text-zinc-400 font-mono">
                                        {param.name} =
                                      </span>
                                      <div className="bg-[#1a1a1d] border border-[#27272a] rounded-lg p-2.5">
                                        <pre className="text-zinc-300 text-[13px] font-mono whitespace-pre-wrap break-words m-0">
                                          {lines[idx] || ""}
                                        </pre>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            }

                            return (
                              <div className="flex flex-col gap-1.5">
                                <span className="text-[12px] font-medium text-zinc-400 font-mono">Input</span>
                                <div className="bg-[#1a1a1d] border border-[#27272a] rounded-lg p-3">
                                  <pre className="text-zinc-300 text-[13px] font-mono whitespace-pre-wrap break-words m-0">
                                    {rawInput}
                                  </pre>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Output block */}
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[12px] font-medium text-zinc-400 font-mono">Output</span>
                            <div className="bg-[#1a1a1d] border border-[#27272a] rounded-lg p-3">
                              <pre
                                className={`text-[13px] font-mono whitespace-pre-wrap break-words m-0 ${
                                  testResults[activeTestCaseId].type === "success"
                                    ? "text-emerald-400"
                                    : testResults[activeTestCaseId].type === "wrong_answer"
                                      ? "text-rose-400"
                                      : testResults[activeTestCaseId].type === "compile_error"
                                        ? "text-rose-300/90"
                                        : testResults[activeTestCaseId].type === "runtime_error"
                                          ? "text-orange-300/90"
                                          : testResults[activeTestCaseId].type === "tle"
                                            ? "text-amber-300/90"
                                            : "text-rose-300/90"
                                }`}
                              >
                                {testResults[activeTestCaseId].body}
                              </pre>
                            </div>
                          </div>

                          {/* Expected Output block (if present) */}
                          {testResults[activeTestCaseId].expectedOutput && (
                            <div className="flex flex-col gap-1.5 mt-2">
                              <span className="text-[12px] font-medium text-zinc-400 font-mono">Expected Output</span>
                              <div className="bg-[#1a1a1d] border border-[#27272a] rounded-lg p-3">
                                <pre className="text-zinc-300 text-[13px] font-mono whitespace-pre-wrap break-words m-0">
                                  {testResults[activeTestCaseId].expectedOutput}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3">
                        <span className="text-zinc-700/60 text-[13px] font-mono">
                          Run your code to see output here
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom scrollbar */}
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #27272a; border-radius: 3px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
      `}</style>
      
      {/* ─── Focus Mode Confirmation Modal ─── */}
      {showFocusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111113] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20">
              <span className="material-symbols-outlined text-[24px]">center_focus_strong</span>
            </div>
            <h2 className="text-[18px] font-bold text-white mb-2">Enter Focus Mode</h2>
            <p className="text-[13px] text-zinc-400 mb-6 leading-relaxed">
              Focus mode hides distractions and locks hints behind a timer (18 min per hint). Solve the problem without opening hints to earn a <strong className="text-emerald-400">+5 Point Focus Bonus</strong>!
            </p>
            <div className="flex items-center gap-3 w-full">
              <button 
                onClick={() => setShowFocusModal(false)}
                className="flex-1 py-2 rounded-xl text-[12px] font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setFocusModeEnabled(true);
                  setHasOpenedHint(false);
                  setFocusTimeElapsed(0);
                  setShowFocusModal(false);
                  setTimerOn(true);
                }}
                className="flex-1 py-2 rounded-xl text-[12px] font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
              >
                Start Focusing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
