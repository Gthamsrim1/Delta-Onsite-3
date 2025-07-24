import fs from 'fs';
import path from 'path';
import { v4 } from 'uuid';

const dirCodes = path.join("\\JavaScript\\delta-onsite-3\\app\\api\\components", "(codes)");

if (!fs.existsSync(dirCodes)) {
    fs.mkdirSync(dirCodes, { recursive: true })
}

function injectJS(userCode) {
  return `
    const fs = require('fs');
    let input = '';
    process.stdin.on('data', chunk => input += chunk);
    process.stdin.on('end', () => {
    const lines = input.trim().split('\\n');
    const inputs = lines.map(line => {
        try { return JSON.parse(line); } catch { return line; }
    });

    // --- User code starts here ---
    ${userCode}
    });
    `;
}

function injectPython(userCode) {
  return `
import sys, json
lines = sys.stdin.read().strip().split('\\n')
inputs = [json.loads(line) if line.startswith('[') or line.startswith('{') or line in ['true', 'false'] else line for line in lines]

# --- User code starts here ---
${userCode}
`;
}


function injectCPP(userCode) {
    return `
    #include <iostream>
    #include <string>
    #include <vector>
    #include <nlohmann/json.hpp>
    using namespace std;
    using json = nlohmann::json;

    int main() {
        string line;
        vector<json> inputs;
        while (getline(cin, line)) {
            try {
                inputs.push_back(json::parse(line));
            } catch (...) {
                inputs.push_back(line);
            }
        }

        // --- User code starts here ---
    ${userCode}

        return 0;
    }
    `;
}

function injectJava(userCode) {
    return `
    import java.util.*;
    import com.google.gson.*;

    public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        Gson gson = new Gson();
        List<Object> inputs = new ArrayList<>();

        while (sc.hasNextLine()) {
        String line = sc.nextLine();
        try {
            inputs.add(gson.fromJson(line, Object.class));
        } catch (Exception e) {
            inputs.add(line);
        }
        }

        // --- User code starts here ---
    ${userCode}
    }
    }
    `;
}

export const GenerateFile = async (format, code) => {
    let injectedCode = '';
    switch (format) {
        case 'js': injectedCode = injectJS(code); break;
        case 'py': injectedCode = injectPython(code); break;
        case 'cpp': injectedCode = injectCPP(code); break;
        case 'java': injectedCode = injectJava(code); break;
    }

    const jobId = v4();
    const filename = `${jobId}.${format}`;
    const filepath = path.join(dirCodes, filename);
    await fs.writeFileSync(filepath, injectedCode)
    return filepath;
}