import { exec, spawn } from 'child_process';
import fs from "fs";
import path from 'path';

const outputPath = path.join("\\JavaScript\\delta-onsite-3\\app\\api\\components", "(outputs)");

if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

export const transformInputForLanguage = (lang, rawInput) => {
  const wrapped = `[${rawInput}]`;
  let parsed;

  try {
    parsed = eval(wrapped); 
  } catch (e) {
    console.error("Error parsing input:", e);
    return rawInput;
  }

  return parsed.map(val => {
    if (typeof val === 'string') return val;
    if (typeof val === 'boolean' || typeof val === 'number') return val.toString();
    return JSON.stringify(val);
  }).join('\n');
};

export const ExecuteCPP = (filepath, rawInput = "") => {
  const input = transformInputForLanguage("cpp", rawInput);
  const jobId = path.basename(filepath).split(".")[0];
  const outputFile = path.join(outputPath, `${jobId}.out`);

  return new Promise((resolve, reject) => {
    const compile = spawn('g++', [filepath, '-o', outputFile]);

    compile.on('error', err => reject({ error: err.message }));
    compile.stderr.on('data', data => reject({ stderr: data.toString() }));

    compile.on('close', (code) => {
      if (code !== 0) return reject({ error: `Compilation failed with code ${code}` });

      const run = spawn(path.join(outputPath, `${jobId}.out`), [], { shell: true });

      let stdout = "";
      let stderr = "";

      run.stdout.on('data', (data) => stdout += data.toString());
      run.stderr.on('data', (data) => stderr += data.toString());

      run.on('error', (err) => reject({ error: err.message }));
      run.on('close', () => {
        if (stderr) return reject({ stderr });
        resolve({ output: stdout });
      });

      run.stdin.write(input);
      run.stdin.end();
    });
  });
};

export const ExecutePython = (filepath, rawInput = "") => {
  const input = transformInputForLanguage("python", rawInput);

  return new Promise((resolve, reject) => {
    const run = spawn('python', [filepath]);

    let stdout = "";
    let stderr = "";

    run.stdout.on('data', (data) => stdout += data.toString());
    run.stderr.on('data', (data) => stderr += data.toString());

    run.on('error', (err) => reject({ error: err.message }));
    run.on('close', () => {
      if (stderr) return reject({ stderr });
      resolve({ output: stdout });
    });

    run.stdin.write(input);
    run.stdin.end();
  });
};

export const ExecuteJava = (filepath, rawInput = "") => {
  const input = transformInputForLanguage("java", rawInput);
  const jobId = path.basename(filepath).split(".")[0];
  const directory = path.dirname(filepath);

  return new Promise((resolve, reject) => {
    const compile = spawn('javac', [filepath]);

    compile.on('error', (err) => reject({ error: err.message }));
    compile.stderr.on('data', (data) => reject({ stderr: data.toString() }));

    compile.on('close', (code) => {
      if (code !== 0) return reject({ error: `Compilation failed with code ${code}` });

      const run = spawn('java', ['-cp', directory, jobId]);

      let stdout = "";
      let stderr = "";

      run.stdout.on('data', (data) => stdout += data.toString());
      run.stderr.on('data', (data) => stderr += data.toString());

      run.on('error', (err) => reject({ error: err.message }));
      run.on('close', () => {
        if (stderr) return reject({ stderr });
        resolve({ output: stdout });
      });

      run.stdin.write(input);
      run.stdin.end();
    });
  });
};

export const ExecuteJavaScript = (filepath, rawInput = "") => {
  const input = transformInputForLanguage("js", rawInput);

  return new Promise((resolve, reject) => {
    const run = spawn('node', [filepath]);

    let stdout = "";
    let stderr = "";

    run.stdout.on('data', (data) => stdout += data.toString());
    run.stderr.on('data', (data) => stderr += data.toString());

    run.on('error', (err) => reject({ error: err.message }));
    run.on('close', () => {
      if (stderr) return reject({ stderr });
      resolve({ output: stdout });
    });

    run.stdin.write(input);
    run.stdin.end();
  });
};
