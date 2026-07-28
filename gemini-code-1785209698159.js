// api/generate.js
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY 환경변수가 설정되어 있지 않습니다.' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt 필드가 필요합니다.' });
  }

  // 스트리밍을 위한 HTTP 헤더 설정
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Cache-Control', 'no-cache, no-transform');

  try {
    const systemInstruction = `
    너는 친절하고 스마트한 타임테이블/일정 관리 도우미야.
    사용자의 요청을 바탕으로 하루 일정을 추천하거나 작성해줘.
    응답할 때 반드시 답변의 **맨 마지막 부분**에 아래 형식의 JSON 블록을 포함해줘.
    
    \`\`\`json
    [
      {"time": "09:00", "task": "아침 운동 및 기상"},
      {"time": "10:30", "task": "프로젝트 회의"}
    ]
    \`\`\`
    `;

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction
      }
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(chunk.text);
      }
    }

    res.end();
  } catch (error) {
    console.error('Gemini API Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Gemini API 호출 오류: ' + error.message });
    } else {
      res.write(`\n[오류 발생: ${error.message}]`);
      res.end();
    }
  }
}