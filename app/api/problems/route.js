import { NextResponse } from 'next/server';
import ProblemModel from '../(models)/Problem';

export async function GET() {
  try {
    const problems = await ProblemModel.find().sort({ _id: 1 });
    return NextResponse.json(problems);
  } catch (error) {
    console.error("Error fetching problems:", error);
    return NextResponse.json(
      { message: 'Failed to fetch problems', error: error.message },
      { status: 500 }
    );
  }
}
