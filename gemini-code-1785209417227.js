// api/generate.js
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({});

export default async function handler(req, res) {
  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // API 키 설정 확인
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY 환경변수가 설정되어 있지 않습니다.' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt 필드가 필요합니다.' });
  }

  // 1. 스트리밍 출력을 위한 HTTP 헤더 설정
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  try {
    // 2. generateContentStream 호출
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    // 3. 텍스트 조각(Chunk)이 들어오는 대로 클라이언트에 쓴다(res.write)
    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(chunk.text);
      }
    }

    // 4. 스트림 종료
    res.end();
  } catch (error) {
    console.error('Gemini Streaming Error:', error);
    
    // 이미 스트리밍 헤더가 전송된 이후라면 JSON 에러 대신 텍스트로 보냄
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Gemini 스트리밍 호출 중 오류가 발생했습니다.',
        details: error.message,
      });
    } else {
      res.write(`\n[Error: ${error.message}]`);
      res.end();
    }
  }
}