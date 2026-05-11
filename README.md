# 현대차 · Hyperliquid × Upbit

현대차 24시간 참고가를 보여주는 Vercel 배포용 Next.js 사이트입니다.

## 계산식

`현대차 원화 환산가 = Hyperliquid HYUNDAI 가격(USD) × Upbit USDT/KRW`

## 데이터 소스

- Hyperliquid `metaAndAssetCtxs` (`dex: "xyz"`)
- Upbit `KRW-USDT` ticker
- Yahoo Finance `005380.KS` daily chart (한국장 종가 비교용)

## 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

## Vercel 배포

1. 이 폴더를 GitHub에 올립니다.
2. Vercel에서 `New Project` → 해당 GitHub repo 선택
3. 그대로 Deploy

## 참고

- 화면은 5초마다 자동 갱신됩니다.
- `HYUNDAI` 계약은 현대차 1주 가격을 USD로 환산한 값을 추적합니다.
- 이 페이지의 원화 환산가는 선물성 참고 가격이며, KRX 정규장 체결가가 아닙니다.
