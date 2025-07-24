import { NextResponse } from 'next/server';
import { GenerateFile } from '../components/GenerateFile';
import { ExecuteCPP, ExecuteJava, ExecuteJavaScript, ExecutePython } from '../components/Execute';

export async function POST(req) {
  try {
    const body = await req.json();
    const { code, lang = "cpp", test_cases = [] } = body;

    if (!code) {
      return NextResponse.json({ message: "Send the code dumbo" }, { status: 400 });
    }

    console.log(lang, code);
    const filepath = await GenerateFile(lang, code);

    let executeFn;
    switch (lang) {
      case "cpp": executeFn = ExecuteCPP; break;
      case "py":
      case "python": executeFn = ExecutePython; break;
      case "js":
      case "javascript": executeFn = ExecuteJS; break;
      case "java": executeFn = ExecuteJava; break;
      default:
        return NextResponse.json({ message: `Language ${lang} not supported.` }, { status: 400 });
    }

    const results = [];

    for (const test of test_cases) {
      const result = await executeFn(filepath, test.input);
      results.push({
        input: test.input,
        expected: test.expected_output,
        output: result.output || result.error,
        passed: result.output?.trim() === test.expected_output?.trim()
      });
    }

    return NextResponse.json({ results });

  } catch (error) {
    console.error("Execution Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
