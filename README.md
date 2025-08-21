# 🚀 DevPilot Frontend

DevPilot은 팀 협업을 위한 직관적인 프로젝트 관리 도구입니다. <br>
칸반 보드와 계층 구조 뷰를 통해 작업을 효율적으로 관리하고, AI 채팅봇을 통해 생산성을 높일 수 있습니다.

## ✨ 주요 기능

### 📊 대시보드
- 프로젝트 및 작업 현황 한눈에 확인
- 마감일이 임박한 작업 알림
- 팀원별 작업 분포도

### 📝 프로젝트 & 작업 관리
- 프로젝트 생성 및 관리
- 작업 생성, 수정, 삭제
- 드래그 앤 드롭으로 작업 상태 변경
- 작업에 댓글 및 첨부파일 추가

### 🌳 계층 구조 뷰
- 프로젝트-하위 작업 트리 구조 시각화
- 작업 간 의존성 관리
- 대용량 프로젝트도 깔끔하게 정리

### 🤖 AI 채팅 어시스턴트
- 자연어로 작업 생성 및 관리
- 프로젝트 관련 질의 응답
- 작업 상태 업데이트

## 🛠 기술 스택

### 프론트엔드
- **프레임워크**: Next.js 13+ (App Router)
- **언어**: TypeScript
- **상태 관리**: React Query, Zustand
- **스타일링**: Tailwind CSS, Radix UI
- **폼 처리**: React Hook Form
- **드래그 앤 드롭**: dnd-kit
- **차트**: Recharts

### 개발 도구
- **패키지 매니저**: npm / yarn
- **코드 포맷팅**: Prettier
- **린팅**: ESLint

## 📂 프로젝트 구조
```
devpilot-frontend/
├── app/                    # 앱 라우트 (Next.js 13+)
│   ├── api/               # API 라우트
│   ├── dashboard/         # 대시보드 페이지
│   ├── projects/          # 프로젝트 관련 페이지
│   └── ...
├── components/            # 재사용 가능한 컴포넌트
│   ├── ui/                # UI 컴포넌트
│   ├── dashboard/         # 대시보드 관련 컴포넌트
│   └── ...
├── lib/                   # 유틸리티 및 설정
│   ├── api/               # API 클라이언트
│   ├── hooks/             # 커스텀 훅
│   └── utils/             # 유틸리티 함수
├── public/                # 정적 파일
└── styles/                # 전역 스타일
```

---

<div align="center">
  <img src="https://avatars.githubusercontent.com/u/67574367?s=150&v=4" alt="조승빈" width="150">
  <br>
  🔗 <a href="https://github.com/vkflco08">GitHub 프로필</a>
</div>
