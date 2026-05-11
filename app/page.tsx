"use client";

import { useEffect, useMemo, useState } from "react";

type Quote = {
  symbol: string;
  hlUsdPrice: number;
  usdtKrw: number;
  impliedKrw: number;
  krxClose: number | null;
  closeDiff: number | null;
  closeDiffPct: number | null;
  volumeKrw: number | null;
  openInterest: number | null;
  funding: number | null;
  premium: number | null;
  oracleKrw: number | null;
  updatedAt: string;
};

const fmtKrw = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 0
});

const fmtUsd = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const fmtPct = new Intl.NumberFormat("ko-KR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "always"
});

const fmtCompactKrw = new Intl.NumberFormat("ko-KR", {
  notation: "compact",
  maximumFractionDigits: 2
});

const fmtNumber = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 4
});

export default function Page() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const res = await fetch("/api/quote", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("가격을 불러오지 못했습니다.");
        }
        const data = (await res.json()) as Quote;
        if (alive) {
          setQuote(data);
          setError(null);
        }
      } catch (e) {
        if (alive) {
          setError(
            e instanceof Error ? e.message : "가격을 불러오지 못했습니다."
          );
        }
      }
    }

    load();
    const timer = setInterval(load, 5000);

    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  const changeClass = useMemo(() => {
    if (!quote?.closeDiff) return "flat";
    return quote.closeDiff > 0 ? "up" : quote.closeDiff < 0 ? "down" : "flat";
  }, [quote]);

  const updatedAt = quote
    ? new Date(quote.updatedAt).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      })
    : "—";

  return (
    <main>
      <div className="header">
        <div className="brand">Hyperliquid 시장가 × Upbit USDT/KRW</div>
        <div className="title-row">
          <h1>현대차 24시간 참고가</h1>
          <span className="pill">5초 자동 갱신</span>
        </div>
      </div>

      <section className="card">
        {error ? (
          <div className="error">{error}</div>
        ) : !quote ? (
          <>
            <div className="skeleton" style={{ width: 100, height: 16, marginBottom: 10 }} />
            <div className="skeleton" style={{ width: 250, height: 48, marginBottom: 12 }} />
            <div className="skeleton" style={{ width: 180, height: 18, marginBottom: 20 }} />
            <div className="grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div className="metric" key={i}>
                  <div className="skeleton" style={{ width: 90, height: 12, marginBottom: 8 }} />
                  <div className="skeleton" style={{ width: 120, height: 18 }} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="symbol">{quote.symbol}</div>
            <div className="price">₩{fmtKrw.format(quote.impliedKrw)}</div>
            <div className="subprice">
              ≈ ${fmtUsd.format(quote.hlUsdPrice)} USD · USDT/KRW ₩
              {fmtKrw.format(quote.usdtKrw)}
            </div>

            {quote.krxClose ? (
              <div className={`change ${changeClass}`}>
                한국장 종가 대비 {fmtPct.format(quote.closeDiffPct ?? 0)} ·{" "}
                {quote.closeDiff && quote.closeDiff > 0 ? "+" : ""}
                ₩{fmtKrw.format(quote.closeDiff ?? 0)}
              </div>
            ) : (
              <div className="change flat">한국장 종가 데이터 없음</div>
            )}

            <div className="grid">
              <div className="metric">
                <div className="metric-label">한국장 종가</div>
                <div className="metric-value">
                  {quote.krxClose ? `₩${fmtKrw.format(quote.krxClose)}` : "—"}
                </div>
              </div>

              <div className="metric">
                <div className="metric-label">24h 거래대금</div>
                <div className="metric-value">
                  {quote.volumeKrw ? `₩${fmtCompactKrw.format(quote.volumeKrw)}` : "—"}
                </div>
              </div>

              <div className="metric">
                <div className="metric-label">미결제약정</div>
                <div className="metric-value">
                  {quote.openInterest != null ? fmtNumber.format(quote.openInterest) : "—"}
                </div>
              </div>

              <div className="metric">
                <div className="metric-label">펀딩비</div>
                <div className="metric-value">
                  {quote.funding != null ? `${fmtPct.format(quote.funding * 100)}` : "—"}
                </div>
              </div>

              <div className="metric">
                <div className="metric-label">오라클 환산가</div>
                <div className="metric-value">
                  {quote.oracleKrw ? `₩${fmtKrw.format(quote.oracleKrw)}` : "—"}
                </div>
              </div>

              <div className="metric">
                <div className="metric-label">오라클 대비 프리미엄</div>
                <div className="metric-value">
                  {quote.premium != null ? `${fmtPct.format(quote.premium * 100)}` : "—"}
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      <div className="footer">
        <div className="row">
          <span>마지막 갱신 {updatedAt}</span>
          <a
            className="link"
            href="https://app.hyperliquid.xyz/trade/xyz%3AHYUNDAI"
            target="_blank"
            rel="noreferrer"
          >
            HYUNDAI 거래 ↗
          </a>
        </div>
        <div>
          본 가격은 Hyperliquid HYUNDAI 계약을 Upbit USDT/KRW로 환산한 참고치이며,
          KRX 정규장 체결가가 아닙니다.
        </div>
      </div>
    </main>
  );
}
