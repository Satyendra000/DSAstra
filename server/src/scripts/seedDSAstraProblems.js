const dns = require("dns");
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require("mongoose");
const Problem = require("../models/Problem");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dsastra");

/**
 * Seed multiple LeetCode-style problems with proper defaultCode and driverCode
 */
const problems = [
  {
    title: "Two Sum",
    problemId: "DSA-1",
    difficulty: "Easy",
    tags: ["Array", "Hash Table"],
    description: `
      <div class="problem-statement">
        <p>Given an array of integers <code>nums</code> and an integer <code>target</code>, 
        return <em>indices of the two numbers</em> such that they add up to <code>target</code>.</p>
        <p>You may assume that each input would have <strong>exactly one solution</strong>, 
        and you may not use the same element twice.</p>
        <p>You can return the answer in any order.</p>
        
        <h3 class="section-title">Example 1:</h3>
        <pre><strong>Input:</strong> nums = [2,7,11,15], target = 9
<strong>Output:</strong> [0,1]
<strong>Explanation:</strong> Because nums[0] + nums[1] == 9, we return [0, 1].</pre>
        
        <h3 class="section-title">Example 2:</h3>
        <pre><strong>Input:</strong> nums = [3,2,4], target = 6
<strong>Output:</strong> [1,2]</pre>
        
        <h3 class="section-title">Example 3:</h3>
        <pre><strong>Input:</strong> nums = [3,3], target = 6
<strong>Output:</strong> [0,1]</pre>
        
        <h3 class="section-title">Constraints:</h3>
        <ul>
          <li>2 ≤ nums.length ≤ 10<sup>4</sup></li>
          <li>-10<sup>9</sup> ≤ nums[i] ≤ 10<sup>9</sup></li>
          <li>-10<sup>9</sup> ≤ target ≤ 10<sup>9</sup></li>
          <li>Only one valid answer exists.</li>
        </ul>
      </div>
    `,
    // Input format: n target num1 num2 ... numN (on separate lines or space-separated)
    examples: [
      { input: "4 9\n2 7 11 15", output: "0 1" },
      { input: "3 6\n3 2 4", output: "1 2" },
      { input: "2 6\n3 3", output: "0 1" }
    ],
    defaultCode: {
      cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Your code here
        
    }
};`,
      python: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        # Your code here
        pass`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your code here
        return new int[]{};
    }
}`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    // Your code here
    
};`
    },
    driverCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

\${USER_CODE_PLACEHOLDER}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int n, target;
    cin >> n >> target;
    
    vector<int> nums(n);
    for (int i = 0; i < n; i++) {
        cin >> nums[i];
    }
    
    Solution sol;
    vector<int> result = sol.twoSum(nums, target);
    
    cout << result[0] << " " << result[1] << endl;
    
    return 0;
}`,
      python: `import sys
from typing import List

\${USER_CODE_PLACEHOLDER}

if __name__ == "__main__":
    data = sys.stdin.read().split()
    idx = 0
    n = int(data[idx]); idx += 1
    target = int(data[idx]); idx += 1
    nums = [int(data[idx + i]) for i in range(n)]
    
    sol = Solution()
    result = sol.twoSum(nums, target)
    print(result[0], result[1])`,
      java: `import java.util.*;

\${USER_CODE_PLACEHOLDER}

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int target = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) {
            nums[i] = sc.nextInt();
        }
        
        Solution sol = new Solution();
        int[] result = sol.twoSum(nums, target);
        System.out.println(result[0] + " " + result[1]);
    }
}`,
      javascript: `const readline = require('readline');

\${USER_CODE_PLACEHOLDER}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

let lines = [];
rl.on('line', (line) => lines.push(line.trim()));
rl.on('close', () => {
    const firstLine = lines[0].split(' ').map(Number);
    const n = firstLine[0];
    const target = firstLine[1];
    const nums = lines[1].split(' ').map(Number);
    
    const result = twoSum(nums, target);
    console.log(result[0] + ' ' + result[1]);
});`
    }
  },
  {
    title: "Reverse Integer",
    problemId: "DSA-2",
    difficulty: "Medium",
    tags: ["Math"],
    description: `
      <div class="problem-statement">
        <p>Given a signed 32-bit integer <code>x</code>, return <code>x</code> with its digits reversed. 
        If reversing <code>x</code> causes the value to go outside the signed 32-bit integer range 
        <code>[-2<sup>31</sup>, 2<sup>31</sup> - 1]</code>, then return <code>0</code>.</p>
        
        <h3 class="section-title">Example 1:</h3>
        <pre><strong>Input:</strong> x = 123
<strong>Output:</strong> 321</pre>
        
        <h3 class="section-title">Example 2:</h3>
        <pre><strong>Input:</strong> x = -123
<strong>Output:</strong> -321</pre>
        
        <h3 class="section-title">Example 3:</h3>
        <pre><strong>Input:</strong> x = 120
<strong>Output:</strong> 21</pre>
        
        <h3 class="section-title">Constraints:</h3>
        <ul>
          <li>-2<sup>31</sup> ≤ x ≤ 2<sup>31</sup> - 1</li>
        </ul>
      </div>
    `,
    examples: [
      { input: "123", output: "321" },
      { input: "-123", output: "-321" },
      { input: "120", output: "21" },
      { input: "0", output: "0" }
    ],
    defaultCode: {
      cpp: `class Solution {
public:
    int reverse(int x) {
        // Your code here
        
    }
};`,
      python: `class Solution:
    def reverse(self, x: int) -> int:
        # Your code here
        pass`,
      java: `class Solution {
    public int reverse(int x) {
        // Your code here
        return 0;
    }
}`,
      javascript: `/**
 * @param {number} x
 * @return {number}
 */
var reverse = function(x) {
    // Your code here
    
};`
    },
    driverCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

\${USER_CODE_PLACEHOLDER}

int main() {
    int x;
    cin >> x;
    
    Solution sol;
    cout << sol.reverse(x) << endl;
    
    return 0;
}`,
      python: `\${USER_CODE_PLACEHOLDER}

if __name__ == "__main__":
    x = int(input())
    sol = Solution()
    print(sol.reverse(x))`,
      java: `import java.util.*;

\${USER_CODE_PLACEHOLDER}

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int x = sc.nextInt();
        
        Solution sol = new Solution();
        System.out.println(sol.reverse(x));
    }
}`,
      javascript: `const readline = require('readline');

\${USER_CODE_PLACEHOLDER}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

rl.on('line', (line) => {
    const x = parseInt(line.trim());
    console.log(reverse(x));
    rl.close();
});`
    }
  },
  {
    title: "Palindrome Number",
    problemId: "DSA-3",
    difficulty: "Easy",
    tags: ["Math"],
    description: `
      <div class="problem-statement">
        <p>Given an integer <code>x</code>, return <code>true</code> if <code>x</code> is a 
        <strong>palindrome</strong>, and <code>false</code> otherwise.</p>
        
        <h3 class="section-title">Example 1:</h3>
        <pre><strong>Input:</strong> x = 121
<strong>Output:</strong> true
<strong>Explanation:</strong> 121 reads as 121 from left to right and from right to left.</pre>
        
        <h3 class="section-title">Example 2:</h3>
        <pre><strong>Input:</strong> x = -121
<strong>Output:</strong> false
<strong>Explanation:</strong> From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome.</pre>
        
        <h3 class="section-title">Example 3:</h3>
        <pre><strong>Input:</strong> x = 10
<strong>Output:</strong> false
<strong>Explanation:</strong> Reads 01 from right to left. Therefore it is not a palindrome.</pre>
        
        <h3 class="section-title">Constraints:</h3>
        <ul>
          <li>-2<sup>31</sup> ≤ x ≤ 2<sup>31</sup> - 1</li>
        </ul>
      </div>
    `,
    examples: [
      { input: "121", output: "true" },
      { input: "-121", output: "false" },
      { input: "10", output: "false" }
    ],
    defaultCode: {
      cpp: `class Solution {
public:
    bool isPalindrome(int x) {
        // Your code here
        
    }
};`,
      python: `class Solution:
    def isPalindrome(self, x: int) -> bool:
        # Your code here
        pass`,
      java: `class Solution {
    public boolean isPalindrome(int x) {
        // Your code here
        return false;
    }
}`,
      javascript: `/**
 * @param {number} x
 * @return {boolean}
 */
var isPalindrome = function(x) {
    // Your code here
    
};`
    },
    driverCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

\${USER_CODE_PLACEHOLDER}

int main() {
    int x;
    cin >> x;
    
    Solution sol;
    cout << (sol.isPalindrome(x) ? "true" : "false") << endl;
    
    return 0;
}`,
      python: `\${USER_CODE_PLACEHOLDER}

if __name__ == "__main__":
    x = int(input())
    sol = Solution()
    print("true" if sol.isPalindrome(x) else "false")`,
      java: `import java.util.*;

\${USER_CODE_PLACEHOLDER}

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int x = sc.nextInt();
        
        Solution sol = new Solution();
        System.out.println(sol.isPalindrome(x) ? "true" : "false");
    }
}`,
      javascript: `const readline = require('readline');

\${USER_CODE_PLACEHOLDER}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

rl.on('line', (line) => {
    const x = parseInt(line.trim());
    console.log(isPalindrome(x) ? "true" : "false");
    rl.close();
});`
    }
  },
  {
    title: "Valid Parentheses",
    problemId: "DSA-4",
    difficulty: "Easy",
    tags: ["String", "Stack"],
    description: `
      <div class="problem-statement">
        <p>Given a string <code>s</code> containing just the characters <code>'('</code>, <code>')'</code>, 
        <code>'{'</code>, <code>'}'</code>, <code>'['</code> and <code>']'</code>, 
        determine if the input string is valid.</p>
        
        <p>An input string is valid if:</p>
        <ol>
          <li>Open brackets must be closed by the same type of brackets.</li>
          <li>Open brackets must be closed in the correct order.</li>
          <li>Every close bracket has a corresponding open bracket of the same type.</li>
        </ol>
        
        <h3 class="section-title">Example 1:</h3>
        <pre><strong>Input:</strong> s = "()"
<strong>Output:</strong> true</pre>
        
        <h3 class="section-title">Example 2:</h3>
        <pre><strong>Input:</strong> s = "()[]{}"
<strong>Output:</strong> true</pre>
        
        <h3 class="section-title">Example 3:</h3>
        <pre><strong>Input:</strong> s = "(]"
<strong>Output:</strong> false</pre>
        
        <h3 class="section-title">Constraints:</h3>
        <ul>
          <li>1 ≤ s.length ≤ 10<sup>4</sup></li>
          <li><code>s</code> consists of parentheses only <code>'()[]{}'</code>.</li>
        </ul>
      </div>
    `,
    examples: [
      { input: "()", output: "true" },
      { input: "()[]{}", output: "true" },
      { input: "(]", output: "false" },
      { input: "([)]", output: "false" },
      { input: "{[]}", output: "true" }
    ],
    defaultCode: {
      cpp: `class Solution {
public:
    bool isValid(string s) {
        // Your code here
        
    }
};`,
      python: `class Solution:
    def isValid(self, s: str) -> bool:
        # Your code here
        pass`,
      java: `class Solution {
    public boolean isValid(String s) {
        // Your code here
        return false;
    }
}`,
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
var isValid = function(s) {
    // Your code here
    
};`
    },
    driverCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

\${USER_CODE_PLACEHOLDER}

int main() {
    string s;
    cin >> s;
    
    Solution sol;
    cout << (sol.isValid(s) ? "true" : "false") << endl;
    
    return 0;
}`,
      python: `\${USER_CODE_PLACEHOLDER}

if __name__ == "__main__":
    s = input().strip()
    sol = Solution()
    print("true" if sol.isValid(s) else "false")`,
      java: `import java.util.*;

\${USER_CODE_PLACEHOLDER}

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.next();
        
        Solution sol = new Solution();
        System.out.println(sol.isValid(s) ? "true" : "false");
    }
}`,
      javascript: `const readline = require('readline');

\${USER_CODE_PLACEHOLDER}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

rl.on('line', (line) => {
    console.log(isValid(line.trim()) ? "true" : "false");
    rl.close();
});`
    }
  },
  {
    title: "Maximum Subarray",
    problemId: "DSA-5",
    difficulty: "Medium",
    tags: ["Array", "Dynamic Programming", "Divide and Conquer"],
    description: `
      <div class="problem-statement">
        <p>Given an integer array <code>nums</code>, find the subarray with the largest sum, 
        and return its sum.</p>
        
        <h3 class="section-title">Example 1:</h3>
        <pre><strong>Input:</strong> nums = [-2,1,-3,4,-1,2,1,-5,4]
<strong>Output:</strong> 6
<strong>Explanation:</strong> The subarray [4,-1,2,1] has the largest sum 6.</pre>
        
        <h3 class="section-title">Example 2:</h3>
        <pre><strong>Input:</strong> nums = [1]
<strong>Output:</strong> 1
<strong>Explanation:</strong> The subarray [1] has the largest sum 1.</pre>
        
        <h3 class="section-title">Example 3:</h3>
        <pre><strong>Input:</strong> nums = [5,4,-1,7,8]
<strong>Output:</strong> 23
<strong>Explanation:</strong> The subarray [5,4,-1,7,8] has the largest sum 23.</pre>
        
        <h3 class="section-title">Constraints:</h3>
        <ul>
          <li>1 ≤ nums.length ≤ 10<sup>5</sup></li>
          <li>-10<sup>4</sup> ≤ nums[i] ≤ 10<sup>4</sup></li>
        </ul>
      </div>
    `,
    examples: [
      { input: "9\n-2 1 -3 4 -1 2 1 -5 4", output: "6" },
      { input: "1\n1", output: "1" },
      { input: "5\n5 4 -1 7 8", output: "23" }
    ],
    defaultCode: {
      cpp: `class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        // Your code here
        
    }
};`,
      python: `class Solution:
    def maxSubArray(self, nums: list[int]) -> int:
        # Your code here
        pass`,
      java: `class Solution {
    public int maxSubArray(int[] nums) {
        // Your code here
        return 0;
    }
}`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var maxSubArray = function(nums) {
    // Your code here
    
};`
    },
    driverCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

\${USER_CODE_PLACEHOLDER}

int main() {
    int n;
    cin >> n;
    
    vector<int> nums(n);
    for (int i = 0; i < n; i++) {
        cin >> nums[i];
    }
    
    Solution sol;
    cout << sol.maxSubArray(nums) << endl;
    
    return 0;
}`,
      python: `\${USER_CODE_PLACEHOLDER}

if __name__ == "__main__":
    n = int(input())
    nums = list(map(int, input().split()))
    
    sol = Solution()
    print(sol.maxSubArray(nums))`,
      java: `import java.util.*;

\${USER_CODE_PLACEHOLDER}

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) {
            nums[i] = sc.nextInt();
        }
        
        Solution sol = new Solution();
        System.out.println(sol.maxSubArray(nums));
    }
}`,
      javascript: `const readline = require('readline');

\${USER_CODE_PLACEHOLDER}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

let lines = [];
rl.on('line', (line) => lines.push(line.trim()));
rl.on('close', () => {
    const nums = lines[1].split(' ').map(Number);
    console.log(maxSubArray(nums));
});`
    }
  }
];

const seed = async () => {
  console.log("🌱 Seeding LeetCode-style problems...\n");
  
  let inserted = 0;
  let skipped = 0;
  
  for (const p of problems) {
    const exists = await Problem.findOne({ problemId: p.problemId });
    
    if (exists) {
      // Update existing problem
      await Problem.updateOne(
        { problemId: p.problemId },
        {
          $set: {
            title: p.title,
            platform: "DSAstra",
            difficulty: p.difficulty,
            tags: p.tags,
            description: p.description,
            examples: JSON.stringify(p.examples),
            defaultCode: p.defaultCode,
            driverCode: p.driverCode,
            url: null
          }
        }
      );
      console.log(`   ✏️  Updated: ${p.title}`);
      skipped++;
    } else {
      await Problem.create({
        title: p.title,
        platform: "DSAstra",
        problemId: p.problemId,
        difficulty: p.difficulty,
        tags: p.tags,
        description: p.description,
        examples: JSON.stringify(p.examples),
        defaultCode: p.defaultCode,
        driverCode: p.driverCode,
        url: null
      });
      console.log(`   ✅ Inserted: ${p.title}`);
      inserted++;
    }
  }
  
  console.log(`\n✨ Done! Inserted: ${inserted}, Updated: ${skipped}`);
  console.log("\n📝 Test your problems:");
  console.log("   1. Go to /problems and filter by platform 'DSAstra'");
  console.log("   2. Open any problem and try the code editor");
  console.log("   3. Write your solution and click Run/Submit\n");
  
  process.exit();
};

seed();
