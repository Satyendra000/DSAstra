const dns = require("dns");
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require("mongoose");
const Problem = require("../models/Problem");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dsastra");

const seed = async () => {
  // Delete existing LC-1 problem if it exists
  await Problem.deleteOne({ problemId: "LC-1" });

  await Problem.create({
    title: "Two Sum (LeetCode Style)",
    platform: "DSAstra",
    problemId: "LC-1",
    difficulty: "Easy",
    description: `
      <p>Given an array of integers <code>nums</code> and an integer <code>target</code>, 
      return <em>indices of the two numbers</em> such that they add up to <code>target</code>.</p>
      <p>You may assume that each input would have <strong>exactly one solution</strong>, 
      and you may not use the same element twice.</p>
      <h3>Example 1:</h3>
      <pre>Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].</pre>
      <h3>Example 2:</h3>
      <pre>Input: nums = [3,2,4], target = 6
Output: [1,2]</pre>
    `,
    
    // Test cases: input format = "n target num1 num2 ... numN"
    examples: JSON.stringify([
      { input: "4 9\n2 7 11 15", output: "0 1" },
      { input: "3 6\n3 2 4", output: "1 2" },
      { input: "2 6\n3 3", output: "0 1" }
    ]),

    // What user sees and edits - just the function signature
    defaultCode: {
      cpp: \`class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your code here
        
    }
};\`,
      python: \`class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        # Write your code here
        pass\`,
      java: \`class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your code here
        return new int[]{};
    }
}\`,
      javascript: \`var twoSum = function(nums, target) {
    // Write your code here
    
};\`
    },

    // Driver code with placeholder - wraps user's function
    driverCode: {
      cpp: \`#include <bits/stdc++.h>
using namespace std;

// ===== USER CODE START =====
\${USER_CODE_PLACEHOLDER}
// ===== USER CODE END =====

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
}\`,
      python: \`import sys
from typing import List

# ===== USER CODE START =====
\${USER_CODE_PLACEHOLDER}
# ===== USER CODE END =====

if __name__ == "__main__":
    data = sys.stdin.read().split()
    idx = 0
    n = int(data[idx]); idx += 1
    target = int(data[idx]); idx += 1
    nums = [int(data[idx + i]) for i in range(n)]
    
    sol = Solution()
    result = sol.twoSum(nums, target)
    print(result[0], result[1])\`,
      java: \`import java.util.*;

// ===== USER CODE START =====
\${USER_CODE_PLACEHOLDER}
// ===== USER CODE END =====

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
}\`,
      javascript: \`const readline = require('readline');

// ===== USER CODE START =====
\${USER_CODE_PLACEHOLDER}
// ===== USER CODE END =====

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
});\`
    }
  });

  console.log("✅ LeetCode-style 'Two Sum' problem seeded successfully!");
  console.log("Test input format: 'n target\\nnum1 num2 ... numN'");
  console.log("Example: '4 9\\n2 7 11 15' should output '0 1'");
  process.exit();
};

seed();
