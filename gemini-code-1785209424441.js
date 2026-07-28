async function streamGemini(userPrompt, onChunkReceived) {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt: userPrompt }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '스트리밍 실패');
  }

  // ReadableStream 읽기
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // 수신된 데이터 조각 디코딩
    const chunk = decoder.decode(value, { stream: true });
    fullText += chunk;

    // 콜백 함수를 통해 UI를 즉시 업데이트
    if (onChunkReceived) {
      onChunkReceived(chunk, fullText);
    }
  }

  return fullText;
}

// --- 사용 예시 ---
// streamGemini("우주에 대해 짧게 설명해줘", (chunk, accumulatedText) => {
//   console.log("실시간 입력 조각:", chunk);
//   document.getElementById('output').innerText = accumulatedText;
// });