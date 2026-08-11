const axios = require("axios");
const cheerio = require("cheerio");

/**
 * Extract LeetCode titleSlug from URL
 * e.g. https://leetcode.com/problems/two-sum/ → two-sum
 */
function getLeetCodeSlug(url) {
  const match = url.match(/leetcode\.com\/problems\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * Extract Codeforces contest + problem from URL
 * e.g. https://codeforces.com/problemset/problem/1/A → { contest: 1, problem: "A" }
 * or   https://codeforces.com/contest/1923/problem/B  → { contest: 1923, problem: "B" }
 */
function getCodeforcesInfo(url) {
  const m1 = url.match(/problemset\/problem\/(\d+)\/([A-Z0-9]+)/);
  if (m1) return { contest: m1[1], problem: m1[2] };
  const m2 = url.match(/contest\/(\d+)\/problem\/([A-Z0-9]+)/);
  if (m2) return { contest: m2[1], problem: m2[2] };
  return null;
}

/**
 * Fetch CodeChef problem code from URL
 * e.g. https://www.codechef.com/problems/FLOW001 → FLOW001
 */
function getCodeChefCode(url) {
  const match = url.match(/codechef\.com\/problems\/([A-Z0-9]+)/i);
  return match ? match[1] : null;
}

/**
 * Generate driver code for LeetCode problems based on metaData
 * This creates the main() function that reads input, calls the user's function, and prints output
 */
function generateDriverCode(metaData, defaultCode) {
  if (!metaData || !metaData.name) return {};
  
  const funcName = metaData.name;
  const params = metaData.params || [];
  const returnType = metaData.return?.type || 'void';
  
  const driverCode = {};
  
  // Generate C++ driver
  if (defaultCode.cpp) {
    driverCode.cpp = generateCppDriver(funcName, params, returnType, defaultCode.cpp);
  }
  
  // Generate Python driver
  if (defaultCode.python) {
    driverCode.python = generatePythonDriver(funcName, params, returnType);
  }
  
  // Generate Java driver
  if (defaultCode.java) {
    driverCode.java = generateJavaDriver(funcName, params, returnType);
  }
  
  // Generate JavaScript driver
  if (defaultCode.javascript) {
    driverCode.javascript = generateJavaScriptDriver(funcName, params, returnType);
  }
  
  return driverCode;
}

/**
 * Map LeetCode types to C++ input parsing code
 */
function getCppTypeInfo(lcType) {
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
    'ListNode': { cppType: 'ListNode*', parse: 'VAR = parseLinkedList();', print: 'printLinkedList(VAR)' },
    'TreeNode': { cppType: 'TreeNode*', parse: 'VAR = parseTree();', print: 'printTree(VAR)' },
  };
  
  return typeMap[lcType] || { cppType: 'auto', parse: 'cin >> VAR;', print: 'cout << VAR' };
}

function generateCppDriver(funcName, params, returnType, defaultCode) {
  // Check if it's a class-based solution
  const isClassBased = defaultCode.includes('class Solution');
  const className = isClassBased ? 'Solution' : '';
  
  let inputParsing = '';
  let funcArgs = [];
  
  for (const param of params) {
    const typeInfo = getCppTypeInfo(param.type);
    const varName = param.name;
    inputParsing += `    ${typeInfo.cppType} ${varName};\n`;
    inputParsing += `    ${typeInfo.parse.replace(/VAR/g, varName)}\n`;
    funcArgs.push(varName);
  }
  
  const returnInfo = getCppTypeInfo(returnType);
  const resultPrint = returnInfo.print.replace(/VAR/g, 'result');
  
  return `#include <bits/stdc++.h>
using namespace std;

// ─── Helper Functions ───
struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};

struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};

ListNode* parseLinkedList() {
    string line; getline(cin, line);
    if(line.empty()) return nullptr;
    if(line.front() == '[') line = line.substr(1);
    if(line.back() == ']') line.pop_back();
    if(line.empty()) return nullptr;
    stringstream ss(line); string item;
    ListNode* dummy = new ListNode(0); ListNode* curr = dummy;
    while (getline(ss, item, ',')) {
        if(item.empty()) continue;
        curr->next = new ListNode(stoi(item));
        curr = curr->next;
    }
    return dummy->next;
}

void printLinkedList(ListNode* head) {
    cout << "[";
    while(head) { cout << head->val; if(head->next) cout << ","; head = head->next; }
    cout << "]" << endl;
}

TreeNode* parseTree() {
    string line; getline(cin, line);
    if(line.empty()) return nullptr;
    if(line.front() == '[') line = line.substr(1);
    if(line.back() == ']') line.pop_back();
    if(line.empty()) return nullptr;
    stringstream ss(line); string item;
    getline(ss, item, ',');
    if(item == "null") return nullptr;
    TreeNode* root = new TreeNode(stoi(item));
    queue<TreeNode*> q; q.push(root);
    while(!q.empty()) {
        TreeNode* node = q.front(); q.pop();
        if(!getline(ss, item, ',')) break;
        if(item != "null" && item != "null ") { node->left = new TreeNode(stoi(item)); q.push(node->left); }
        if(!getline(ss, item, ',')) break;
        if(item != "null" && item != "null ") { node->right = new TreeNode(stoi(item)); q.push(node->right); }
    }
    return root;
}

void printTree(TreeNode* root) {
    if(!root) { cout << "[]" << endl; return; }
    vector<string> res; queue<TreeNode*> q; q.push(root);
    while(!q.empty()) {
        TreeNode* node = q.front(); q.pop();
        if(node) { res.push_back(to_string(node->val)); q.push(node->left); q.push(node->right); }
        else res.push_back("null");
    }
    while(!res.empty() && res.back() == "null") res.pop_back();
    cout << "[";
    for(int i=0; i<res.size(); i++) cout << res[i] << (i==res.size()-1 ? "" : ",");
    cout << "]" << endl;
}

// ─── Primitive Parsers ───
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
    // Simple parsing for [[1,2],[3,4]] format
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
    ${returnType !== 'void' ? (resultPrint.startsWith('cout') ? resultPrint + ' << endl;' : resultPrint + ';') : ''}
    
    return 0;
}`;
}

function generatePythonDriver(funcName, params, returnType) {
  let inputParsing = '';
  let funcArgs = [];
  
  for (let i = 0; i < params.length; i++) {
    const param = params[i];
    const varName = param.name;
    
    if (param.type === 'ListNode') {
      inputParsing += `    ${varName} = parse_linked_list(input().strip())\n`;
    } else if (param.type === 'TreeNode') {
      inputParsing += `    ${varName} = parse_tree(input().strip())\n`;
    } else if (param.type.includes('[]') || param.type.includes('list')) {
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
import json

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def parse_linked_list(arr_str):
    if not arr_str: return None
    arr = json.loads(arr_str)
    if not arr: return None
    dummy = ListNode(0)
    curr = dummy
    for val in arr:
        curr.next = ListNode(val)
        curr = curr.next
    return dummy.next

def print_linked_list(head):
    res = []
    while head:
        res.append(head.val)
        head = head.next
    print(json.dumps(res).replace(" ", ""))

def parse_tree(arr_str):
    if not arr_str: return None
    arr = json.loads(arr_str)
    if not arr: return None
    root = TreeNode(arr[0])
    q = deque([root])
    i = 1
    while q and i < len(arr):
        node = q.popleft()
        if i < len(arr) and arr[i] is not None:
            node.left = TreeNode(arr[i])
            q.append(node.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.right = TreeNode(arr[i])
            q.append(node.right)
        i += 1
    return root

def print_tree(root):
    if not root: 
        print("[]")
        return
    res = []
    q = deque([root])
    while q:
        node = q.popleft()
        if node:
            res.append(node.val)
            q.append(node.left)
            q.append(node.right)
        else:
            res.append(None)
    while res and res[-1] is None:
        res.pop()
    print(json.dumps(res).replace(" ", ""))

\${USER_CODE_PLACEHOLDER}

if __name__ == "__main__":
${inputParsing}
    sol = Solution()
    result = sol.${funcName}(${funcArgs.join(', ')})
    ${returnType === 'ListNode' ? 'print_linked_list(result)' : returnType === 'TreeNode' ? 'print_tree(result)' : returnType === 'boolean' ? "print('true' if result else 'false')" : 'print(result)'}`;
}

function generateJavaDriver(funcName, params, returnType) {
  let inputParsing = '';
  let funcArgs = [];
  
  for (const param of params) {
    const varName = param.name;
    
    if (param.type === 'ListNode') {
      inputParsing += `        ListNode ${varName} = Helper.parseLinkedList(sc.nextLine().trim());\n`;
    } else if (param.type === 'TreeNode') {
      inputParsing += `        TreeNode ${varName} = Helper.parseTree(sc.nextLine().trim());\n`;
    } else if (param.type === 'integer[]') {
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

class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode() {}
    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}

class Helper {
    public static ListNode parseLinkedList(String s) {
        if(s == null || s.length() <= 2) return null;
        String[] arr = s.substring(1, s.length() - 1).split(",");
        ListNode dummy = new ListNode(0);
        ListNode curr = dummy;
        for(String item : arr) {
            item = item.trim();
            if(item.isEmpty()) continue;
            curr.next = new ListNode(Integer.parseInt(item));
            curr = curr.next;
        }
        return dummy.next;
    }
    
    public static void printLinkedList(ListNode head) {
        System.out.print("[");
        while(head != null) {
            System.out.print(head.val);
            if(head.next != null) System.out.print(",");
            head = head.next;
        }
        System.out.println("]");
    }
    
    public static TreeNode parseTree(String s) {
        if(s == null || s.length() <= 2) return null;
        String[] arr = s.substring(1, s.length() - 1).split(",");
        if(arr.length == 0 || arr[0].trim().equals("null")) return null;
        TreeNode root = new TreeNode(Integer.parseInt(arr[0].trim()));
        Queue<TreeNode> q = new LinkedList<>();
        q.offer(root);
        int i = 1;
        while(!q.isEmpty() && i < arr.length) {
            TreeNode node = q.poll();
            String leftItem = arr[i++].trim();
            if(!leftItem.equals("null")) {
                node.left = new TreeNode(Integer.parseInt(leftItem));
                q.offer(node.left);
            }
            if(i < arr.length) {
                String rightItem = arr[i++].trim();
                if(!rightItem.equals("null")) {
                    node.right = new TreeNode(Integer.parseInt(rightItem));
                    q.offer(node.right);
                }
            }
        }
        return root;
    }
    
    public static void printTree(TreeNode root) {
        if(root == null) { System.out.println("[]"); return; }
        List<String> res = new ArrayList<>();
        Queue<TreeNode> q = new LinkedList<>();
        q.offer(root);
        while(!q.isEmpty()) {
            TreeNode node = q.poll();
            if(node != null) {
                res.add(String.valueOf(node.val));
                q.offer(node.left);
                q.offer(node.right);
            } else {
                res.add("null");
            }
        }
        while(!res.isEmpty() && res.get(res.size() - 1).equals("null")) {
            res.remove(res.size() - 1);
        }
        System.out.print("[");
        for(int i=0; i<res.size(); i++) {
            System.out.print(res.get(i) + (i == res.size()-1 ? "" : ","));
        }
        System.out.println("]");
    }
}

\${USER_CODE_PLACEHOLDER}

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
${inputParsing}
        Solution sol = new Solution();
        ${returnType !== 'void' ? `var result = sol.${funcName}(${funcArgs.join(', ')});` : `sol.${funcName}(${funcArgs.join(', ')});`}
        ${returnType === 'ListNode' ? 'Helper.printLinkedList(result);' : returnType === 'TreeNode' ? 'Helper.printTree(result);' : returnType === 'integer[]' ? 'System.out.println(Arrays.toString(result));' : returnType === 'boolean' ? 'System.out.println(result ? "true" : "false");' : returnType !== 'void' ? 'System.out.println(result);' : ''}
    }
}`;
}

function generateJavaScriptDriver(funcName, params, returnType) {
  let inputParsing = '';
  let funcArgs = [];
  
  for (let i = 0; i < params.length; i++) {
    const param = params[i];
    const varName = param.name;
    
    if (param.type === 'ListNode') {
      inputParsing += `    const ${varName} = parseLinkedList(JSON.parse(lines[${i}]));\n`;
    } else if (param.type === 'TreeNode') {
      inputParsing += `    const ${varName} = parseTree(JSON.parse(lines[${i}]));\n`;
    } else if (param.type.includes('[]')) {
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

function ListNode(val, next) {
    this.val = (val===undefined ? 0 : val)
    this.next = (next===undefined ? null : next)
}
function TreeNode(val, left, right) {
    this.val = (val===undefined ? 0 : val)
    this.left = (left===undefined ? null : left)
    this.right = (right===undefined ? null : right)
}
function parseLinkedList(arr) {
    if (!arr || arr.length === 0) return null;
    let dummy = new ListNode(0);
    let curr = dummy;
    for (let x of arr) {
        curr.next = new ListNode(x);
        curr = curr.next;
    }
    return dummy.next;
}
function printLinkedList(head) {
    let res = [];
    while (head) { res.push(head.val); head = head.next; }
    console.log(JSON.stringify(res));
}
function parseTree(arr) {
    if (!arr || arr.length === 0) return null;
    let root = new TreeNode(arr[0]);
    let q = [root];
    let i = 1;
    while (q.length > 0 && i < arr.length) {
        let node = q.shift();
        if (i < arr.length && arr[i] !== null) {
            node.left = new TreeNode(arr[i]);
            q.push(node.left);
        }
        i++;
        if (i < arr.length && arr[i] !== null) {
            node.right = new TreeNode(arr[i]);
            q.push(node.right);
        }
        i++;
    }
    return root;
}
function printTree(root) {
    if (!root) { console.log("[]"); return; }
    let res = [];
    let q = [root];
    while (q.length > 0) {
        let node = q.shift();
        if (node) {
            res.push(node.val);
            q.push(node.left);
            q.push(node.right);
        } else {
            res.push(null);
        }
    }
    while (res.length > 0 && res[res.length - 1] === null) res.pop();
    console.log(JSON.stringify(res));
}

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
    ${returnType === 'ListNode' ? 'printLinkedList(result);' : returnType === 'TreeNode' ? 'printTree(result);' : returnType === 'boolean' ? "console.log(result ? 'true' : 'false');" : 'console.log(JSON.stringify(result));'}
});`;
}

// ─── LeetCode ───────────────────────────────────────────────
async function fetchLeetCode(url) {
  const titleSlug = getLeetCodeSlug(url);
  if (!titleSlug) throw new Error("Invalid LeetCode URL");

  // Try GraphQL API first (more reliable)
  try {
    const { data } = await axios.post(
      "https://leetcode.com/graphql/",
      {
        query: `query getQuestion($titleSlug: String!) {
          question(titleSlug: $titleSlug) {
            questionId
            title
            difficulty
            content
            exampleTestcases
            topicTags { name }
            hints
            sampleTestCase
            codeSnippets {
              lang
              langSlug
              code
            }
            metaData
          }
        }`,
        variables: { titleSlug },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Origin: "https://leetcode.com",
          Referer: `https://leetcode.com/problems/${titleSlug}/`,
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json",
          "Accept-Language": "en-US,en;q=0.9",
        },
        timeout: 15000,
      },
    );

    const q = data?.data?.question;
    if (!q || !q.content) throw new Error("GraphQL returned no content");

    console.log(`[Scraper] LeetCode GraphQL success for: ${titleSlug}`);
    
    // Extract code snippets for each language
    const defaultCode = {};
    const codeSnippets = q.codeSnippets || [];
    
    for (const snippet of codeSnippets) {
      const langMap = {
        'cpp': 'cpp',
        'java': 'java', 
        'python3': 'python',
        'python': 'python',
        'javascript': 'javascript',
        'c': 'c'
      };
      
      const ourLang = langMap[snippet.langSlug];
      if (ourLang && snippet.code) {
        defaultCode[ourLang] = snippet.code;
      }
    }
    
    // Generate driver code from metaData if available
    let driverCode = {};
    let metaData = null;
    
    try {
      if (q.metaData) {
        metaData = JSON.parse(q.metaData);
        driverCode = generateDriverCode(metaData, defaultCode);
      }
    } catch (e) {
      console.warn(`[Scraper] Could not parse metaData for ${titleSlug}:`, e.message);
    }

    return {
      description: q.content,
      examples: q.exampleTestcases || "",
      hints: q.hints || [],
      tags: q.topicTags?.map((t) => t.name) || [],
      defaultCode,
      driverCode,
      metaData
    };
  } catch (gqlErr) {
    console.warn(
      `[Scraper] LeetCode GraphQL failed: ${gqlErr.message}, trying HTML fallback...`,
    );
  }

  // Fallback: scrape the HTML page directly
  try {
    const { data: html } = await axios.get(
      `https://leetcode.com/problems/${titleSlug}/description/`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
        },
        timeout: 15000,
      },
    );

    // LeetCode embeds problem data as JSON in a <script> tag
    const jsonMatch = html.match(
      /"question":\s*(\{[\s\S]*?\})\s*,\s*"questionId"/,
    );
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.content) {
        console.log(
          `[Scraper] LeetCode HTML fallback success for: ${titleSlug}`,
        );
        return {
          description: parsed.content,
          examples: parsed.exampleTestcases || "",
          hints: parsed.hints || [],
          tags: [],
        };
      }
    }

    // Cheerio fallback
    const $ = cheerio.load(html, { decodeEntities: false });
    const descEl =
      $('[data-key="description-content"]').html() ||
      $(".question-content").html();
    if (descEl) {
      return { description: descEl, examples: "", hints: [], tags: [] };
    }
  } catch (htmlErr) {
    console.warn(`[Scraper] LeetCode HTML fallback failed: ${htmlErr.message}`);
  }

  throw new Error(
    `LeetCode: Could not fetch problem "${titleSlug}" via GraphQL or HTML`,
  );
}

// ─── HTML Entity cleanup ─────────────────────────────────────
function cleanHtml(html) {
  if (!html) return "";
  return (
    html
      // Fix double-encoded entities
      .replace(/&amp;lt;/g, "&lt;")
      .replace(/&amp;gt;/g, "&gt;")
      .replace(/&amp;amp;/g, "&amp;")
      .replace(/&amp;le;/g, "\u2264")
      .replace(/&amp;ge;/g, "\u2265")
      .replace(/&amp;ne;/g, "\u2260")
      .replace(/&amp;nbsp;/g, " ")
      .replace(/&amp;minus;/g, "\u2212")
      .replace(/&amp;ldquo;/g, "\u201C")
      .replace(/&amp;rdquo;/g, "\u201D")
      .replace(/&amp;lsquo;/g, "\u2018")
      .replace(/&amp;rsquo;/g, "\u2019")
      .replace(/&amp;hellip;/g, "\u2026")
      .replace(/&amp;mdash;/g, "\u2014")
      .replace(/&amp;ndash;/g, "\u2013")
      .replace(/&amp;times;/g, "\u00D7")
      .replace(/&amp;cdot;/g, "\u00B7")
      // Decode numeric HTML entities
      .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16)),
      )
      // Named entities that cheerio commonly produces
      .replace(/&le;/g, "\u2264")
      .replace(/&ge;/g, "\u2265")
      .replace(/&ne;/g, "\u2260")
      .replace(/&minus;/g, "\u2212")
      .replace(/&nbsp;/g, " ")
      .replace(/&ldquo;/g, "\u201C")
      .replace(/&rdquo;/g, "\u201D")
      .replace(/&lsquo;/g, "\u2018")
      .replace(/&rsquo;/g, "\u2019")
      .replace(/&hellip;/g, "\u2026")
      .replace(/&mdash;/g, "\u2014")
      .replace(/&ndash;/g, "\u2013")
      .replace(/&times;/g, "\u00D7")
      .replace(/&cdot;/g, "\u00B7")
  );
}

// ─── Codeforces ──────────────────────────────────────────────
async function fetchCodeforces(url) {
  const info = getCodeforcesInfo(url);
  if (!info) throw new Error("Invalid Codeforces URL");

  const scrapeUrl = `https://codeforces.com/problemset/problem/${info.contest}/${info.problem}`;

  const { data } = await axios.get(scrapeUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    timeout: 10000,
  });

  // decodeEntities: false prevents cheerio from encoding characters like < > into &lt; &gt;
  const $ = cheerio.load(data, { decodeEntities: false });

  const statementEl = $(".problem-statement");
  if (!statementEl.length) throw new Error("Could not find problem statement");

  statementEl.find(".header").remove();

  // Extract examples (CPH-style)
  const examplesArr = [];
  statementEl.find(".sample-test .input").each((i, el) => {
    let inputStr = "";
    if ($(el).find("pre .test-example-line").length > 0) {
      $(el)
        .find("pre .test-example-line")
        .each((_, line) => {
          inputStr += $(line).text() + "\n";
        });
    } else {
      let raw = $(el).find("pre").html() || "";
      raw = raw.replace(/<br\s*\/?>/gi, "\n");
      inputStr = cheerio
        .load(`<body>${raw}</body>`, { decodeEntities: false })("body")
        .text();
    }

    const outputEl = statementEl.find(".sample-test .output").eq(i);
    let outputStr = "";
    if (outputEl.find("pre .test-example-line").length > 0) {
      outputEl.find("pre .test-example-line").each((_, line) => {
        outputStr += $(line).text() + "\n";
      });
    } else {
      let raw = outputEl.find("pre").html() || "";
      raw = raw.replace(/<br\s*\/?>/gi, "\n");
      outputStr = cheerio
        .load(`<body>${raw}</body>`, { decodeEntities: false })("body")
        .text();
    }

    examplesArr.push({
      input: inputStr.trim(),
      output: outputStr.trim(),
    });
  });

  statementEl.find(".sample-tests").remove();

  let description = statementEl.html()?.trim() || "";

  // Codeforces uses $$$ for INLINE math. Convert to single $ (not $$ which is display math)
  description = description.replace(/\$\$\$/g, "$");
  // Clean up any double-encoded entities
  description = cleanHtml(description);

  const timeLimit = $(".time-limit")
    .text()
    .replace("time limit per test", "")
    .trim();
  const memoryLimit = $(".memory-limit")
    .text()
    .replace("memory limit per test", "")
    .trim();

  return {
    description,
    examples: JSON.stringify(examplesArr),
    meta: { timeLimit, memoryLimit },
    hints: [],
    tags: [],
  };
}

// ─── CodeChef ────────────────────────────────────────────────
async function fetchCodeChef(url) {
  const code = getCodeChefCode(url);
  if (!code) throw new Error("Invalid CodeChef URL");

  // Try the practice API first
  try {
    const { data } = await axios.get(
      `https://www.codechef.com/api/contests/PRACTICE/problems/${code}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json",
        },
        timeout: 15000,
      },
    );

    if (data?.problem_name || data?.body) {
      const description =
        data.body ||
        data.problemComponents?.statement?.value ||
        "<p>See original problem for statement.</p>";

      // Clean up the description HTML
      let cleanedDesc = cleanHtml(description);

      return {
        description: cleanedDesc,
        examples: data.problemComponents?.sampleTestCases
          ? JSON.stringify(data.problemComponents.sampleTestCases)
          : null,
        hints: [],
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()) : [],
        meta: {
          timeLimit: data.max_timelimit ? `${data.max_timelimit} secs` : null,
          memoryLimit: data.max_memory ? `${data.max_memory}M` : null,
        },
      };
    }
  } catch (apiErr) {
    console.warn(
      `[Scraper] CodeChef API failed: ${apiErr.message}, trying HTML scrape...`,
    );
  }

  // Fallback: Scrape the HTML page
  try {
    const { data: html } = await axios.get(
      `https://www.codechef.com/problems/${code}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "text/html,application/xhtml+xml",
        },
        timeout: 15000,
      },
    );

    const $ = cheerio.load(html, { decodeEntities: false });

    // CodeChef stores problem data in a script tag
    const scriptContent =
      $('script:contains("window.__NUXT__")').html() ||
      $('script:contains("problemStatement")').html();

    if (scriptContent) {
      // Try to extract problem statement from Next.js/Nuxt data
      const statementMatch = scriptContent.match(
        /"problemStatement":\s*"([^"]+)"/,
      );
      if (statementMatch) {
        let statement = statementMatch[1];
        statement = statement.replace(/\\n/g, "\n").replace(/\\"/g, '"');
        return {
          description: statement,
          examples: null,
          hints: [],
          tags: [],
        };
      }
    }

    // Try direct DOM scraping
    const problemStatement =
      $(".problem-statement").html() ||
      $("[class*='problem']").first().html() ||
      $("main").html();

    if (problemStatement) {
      return {
        description: cleanHtml(problemStatement),
        examples: null,
        hints: [],
        tags: [],
      };
    }
  } catch (scrapeErr) {
    console.warn(`[Scraper] CodeChef HTML scrape failed: ${scrapeErr.message}`);
  }

  throw new Error(`CodeChef: Could not fetch problem "${code}"`);
}

// ─── Main dispatcher ─────────────────────────────────────────
async function fetchProblemDescription(platform, url) {
  const p = (platform || "").toLowerCase();

  if (p.includes("leetcode")) {
    return await fetchLeetCode(url);
  } else if (p.includes("codeforces")) {
    return await fetchCodeforces(url);
  } else if (p.includes("codechef")) {
    return await fetchCodeChef(url);
  }

  throw new Error(`Unsupported platform: ${platform}`);
}

module.exports = { 
  fetchProblemDescription,
  generateDriverCode,
  getCppTypeInfo,
  generateCppDriver,
  generatePythonDriver,
  generateJavaDriver,
  generateJavaScriptDriver
};
