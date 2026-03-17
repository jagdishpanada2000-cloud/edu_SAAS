import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(req: Request) {
  try {
    const { message, branchId, testResults } = await req.json()
    
    if (!branchId || !testResults) {
      return NextResponse.json({ error: 'Missing context' }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 })
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' })

    const systemPrompt = `
      You are an AI Education Assistant for EduPulse Coaching. 
      You have access to the current test results for a batch.
      
      Context:
      Topic: ${testResults[0]?.topic || 'Test'}
      Date: ${testResults[0]?.test_date || 'N/A'}
      Total Marks: ${testResults[0]?.total_marks || 100}
      
      Data: 
      ${JSON.stringify(testResults.map(r => ({ name: r.student_name, email: r.student_email, marks: r.marks_obtained })))}

      Instructions:
      - Answer questions about student performance based ONLY on the provided data.
      - If asked to create/export an Excel sheet for "high scorers" or "low scorers", 
        ALWAYS format your response to include this EXACT JSON block at the end: 
        \`\`\`json_export_data
        [{"name": "...", "email": "...", "marks": ...}]
        \`\`\`
      - High scorers: >= 75% marks.
      - Low scorers: < 40% marks.
      - Provide a summary of the average, highest, and lowest marks when asked.
    `

    const response = await model.generateContent([systemPrompt, message])
    const reply = response.response.text()

    return NextResponse.json({ reply })
  } catch (error: any) {
    console.error('Gemini AI Results Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
