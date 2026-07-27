import { GoogleGenAI, Type } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { healthInfo } = req.body;

  if (!healthInfo) {
    return res.status(400).json({ error: '건강 정보를 입력해주세요.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY_1가 설정되지 않았습니다.' });
  }

  const ai = new GoogleGenAI({ apiKey });

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      schedule: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            time: { type: Type.STRING, description: 'HH:MM 형식의 시간 (예: 08:00)' },
            title: { type: Type.STRING, description: '일정 요약 (예: 아침 약 복용 및 식사)' },
            type: { type: Type.STRING, description: '약 / 식단 / 운동 / 병원 중 하나' }
          },
          required: ['time', 'title', 'type']
        }
      },
      detailedPlan: {
        type: Type.STRING,
        description: '전체적인 건강 관리 가이드, 식단 추천, 운동 팁, 병원 진료 관련 안내를 담은 텍스트 설명 (마크다운 형식 가능)'
      }
    },
    required: ['schedule', 'detailedPlan']
  };

  try {
    const prompt = `
사용자의 건강 정보:
${healthInfo}

위 사용자의 건강 상태, 복용 약/영양제, 진료 계획을 종합하여 [약 복용시간, 식단, 운동 계획, 병원 진료계획]이 포함된 하루 일과 타임테이블과 자세한 건강 케어 설명을 작성해 주세요.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        systemInstruction: '당신은 친절하고 전문적인 AI 개인 건강 코치입니다. 편안하고 즐거운 톤으로 사용자의 건강 관리를 돕는 플랜을 만들어주세요.'
      }
    });

    const result = JSON.parse(response.text);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ error: 'AI 플랜 생성 중 오류가 발생했습니다.' });
  }
}
