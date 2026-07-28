// api/feedback.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // 1. 의견 목록 불러오기 (GET)
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // 2. 새로운 의견 작성하기 (POST)
  if (req.method === 'POST') {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: '내용을 입력해주세요.' });

    const { data, error } = await supabase
      .from('feedbacks')
      .insert([{ content }]);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ message: '성공적으로 등록되었습니다.' });
  }

  return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
}