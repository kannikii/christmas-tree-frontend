# Christmas Tree Frontend

Railway 백엔드(`https://christmas-tree-backend-production.up.railway.app`)와 통신하는 Vite 기반 React 프로젝트입니다. 모든 API 호출은 axios 인스턴스를 통해 동일한 베이스 URL과 쿠키 설정을 사용합니다.

## 개발 방법

```bash
npm install
npm run dev    # 로컬 개발 서버
npm run build  # 프로덕션 빌드
```

## 환경변수

프론트는 Vite 환경 변수 `VITE_API_URL` 값으로 백엔드 주소를 참조합니다. 배포 전 `.env` 파일을 생성하고 예시에 맞게 값을 지정하세요.

```bash
cp .env.example .env
```

`VITE_API_URL` 값은 Railway 백엔드 URL (예: `https://christmas-tree-backend-production.up.railway.app`) 로 맞춰야 Vercel 배포본에서도 올바르게 통신합니다.

## Vercel 배포 팁

- `vercel.json` 파일에 Vite용 빌드/출력 설정이 포함되어 있습니다.
- Vercel 프로젝트의 환경 변수 탭에 `VITE_API_URL` 을 추가합니다.
- Railway 백엔드의 `FRONTEND_URL` 환경 변수는 `https://christmas-tree-frontend.vercel.app` 으로 설정하고 재배포해야 CORS 에러가 발생하지 않습니다.
