import { GoogleGenAI, Type } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { healthInfo } = req.body || {};

  if (!healthInfo) {
    return res.status(400).json({ error: '건강 정보를 입력해주세요.' });
  }

  // Vercel 환경변수에 설정한 이름과 동일한지 확인 (예: GEMINI_API_KEY)
  const apiKey = process.env.GEMINI_API_KEY_1; 
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY_1 환경변수가 설정되지 않았습니다.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // JSON 출력 구조 규격 정의
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        schedule: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              time: { type: Type.STRING, description: 'HH:MM 형식의 시간 (예: 08:00)' },
              title: { type: Type.STRING, description: '수행할 일정 내용' },
              type: { type: Type.STRING, description: '약 / 식단 / 운동 / 병원 / 검사 중 하나' }
            },
            required: ['time', 'title', 'type']
          }
        },
        detailedPlan: {
          type: Type.STRING,
          description: '상세 건강 관리 가이드 텍스트'
        }
      },
      required: ['schedule', 'detailedPlan']
    };

    const prompt = `
사용자 건강 정보:
${healthInfo}

위 사용자 정보를 바탕으로 [약 복용시간, 식단, 운동, 예정된 병원 진료 및 검사]가 포함된 하루 타임테이블과 상세 건강 리포트를 작성해 주세요.
`;

    // 💡 올바른 모델명(gemini-2.5-flash) 사용
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        systemInstruction: '당신은 전문적인 AI 개인 건강 코치입니다.'
      }
    });

    // 💡 안전한 텍스트 검사 로직
    const responseText = response.text;
    if (!responseText) {
      throw new Error('Gemini API 응답 결과가 비어 있습니다.');
    }

    const result = JSON.parse(responseText);
    return res.status(200).json(result);

  } catch (error) {
    console.error('Gemini API Error:', error);
    // 상세 에러 내용을 클라이언트로 전달
    return res.status(500).json({ 
      error: error.message || 'AI 플랜 생성 중 오류가 발생했습니다.' 
    });
  }
}
