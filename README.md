# Vercel Gemini Feedback App

Vercel에 배포할 수 있는 서버리스 구조의 피드백 웹앱 프로젝트입니다.

## 폴더 구조
- `public/index.html`: 프론트엔드 웹 페이지
- `api/generate.js`: Gemini API를 호출하는 서버리스 함수
- `.env.example`: 환경변수 샘플 파일

## 배포 방법
1. GitHub 저장소에 코드를 올립니다.
2. Vercel에서 프로젝트를 연결(Import)합니다.
3. Environment Variables 설정에 `GEMINI_API_KEY`를 추가합니다.
4. Deploy 버튼을 눌러 배포합니다.
