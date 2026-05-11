import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type HyperliquidMeta = {
  universe: Array<{ name: string }>;
};

type HyperliquidCtx = {
  funding?: string | null;
  openInterest?: string | null;
  prevDayPx?: string | null;
  dayNtlVlm?: string | null;
  premium?: string | null;
  oraclePx?: string | null;
  markPx?: string | null;
  midPx?: string | null;
};

type UpbitTicker = Array<{
  trade_price: number;
}>;

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
        }>;
      };
    }>;
  };
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!res.ok) {
    throw new Error(`${url} failed with ${res.status}`);
  }

  return res.json() as Promise<T>;
}

async function getHyundaiCtx() {
  const [meta, ctxs] = await fetchJson<[HyperliquidMeta, HyperliquidCtx[]]>(
    "https://api.hyperliquid.xyz/info",
    {
      method: "POST",
      body: JSON.stringify({
        type: "metaAndAssetCtxs",
        dex: "xyz"
      })
    }
  );

  const idx = meta.universe.findIndex((asset) => asset.name === "HYUNDAI");
  if (idx === -1) {
    throw new Error("HYUNDAI market not found");
  }

  return ctxs[idx];
}

async function getUsdtKrw() {
  const data = await fetchJson<UpbitTicker>(
    "https://api.upbit.com/v1/ticker?markets=KRW-USDT"
  );

  const price = data?.[0]?.trade_price;
  if (!price) {
    throw new Error("USDT/KRW not found");
  }

  return price;
}

async function getKrxClose() {
  try {
    const data = await fetchJson<YahooChartResponse>(
      "https://query1.finance.yahoo.com/v8/finance/chart/005380.KS?range=5d&interval=1d"
    );

    const closes =
      data.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.filter(
        (value): value is number => typeof value === "number"
      ) ?? [];

    return closes.at(-1) ?? null;
  } catch {
    return null;
  }
}

function toNumber(value?: string | null) {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function GET() {
  try {
    const [ctx, usdtKrw, krxClose] = await Promise.all([
      getHyundaiCtx(),
      getUsdtKrw(),
      getKrxClose()
    ]);

    const hlUsdPrice =
      toNumber(ctx.midPx) ??
      toNumber(ctx.markPx) ??
      toNumber(ctx.oraclePx);

    if (!hlUsdPrice) {
      throw new Error("HYUNDAI price unavailable");
    }

    const impliedKrw = hlUsdPrice * usdtKrw;
    const oracleKrw = toNumber(ctx.oraclePx)
      ? Number(ctx.oraclePx) * usdtKrw
      : null;
    const volumeKrw = toNumber(ctx.dayNtlVlm)
      ? Number(ctx.dayNtlVlm) * usdtKrw
      : null;

    const closeDiff = krxClose ? impliedKrw - krxClose : null;
    const closeDiffPct = krxClose ? (closeDiff! / krxClose) * 100 : null;

    return NextResponse.json(
      {
        symbol: "xyz:HYUNDAI",
        hlUsdPrice,
        usdtKrw,
        impliedKrw,
        krxClose,
        closeDiff,
        closeDiffPct,
        volumeKrw,
        openInterest: toNumber(ctx.openInterest),
        funding: toNumber(ctx.funding),
        premium: toNumber(ctx.premium),
        oracleKrw,
        updatedAt: new Date().toISOString()
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0"
        }
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error"
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0"
        }
      }
    );
  }
}
