import { describe, expect, it } from "vitest";
import { buildCreateBody, sanitizeSymbol } from "../launch";

describe("sanitizeSymbol", () => {
  it("strips the $ and punctuation, uppercases, and caps at 10 chars", () => {
    expect(sanitizeSymbol("$GAME")).toBe("GAME");
    expect(sanitizeSymbol("my cool game!")).toBe("MYCOOLGAME");
    expect(sanitizeSymbol("a-b_c")).toBe("ABC");
    expect(sanitizeSymbol("supercalifragilistic")).toHaveLength(10);
    expect(sanitizeSymbol("###")).toBe("");
  });
});

describe("buildCreateBody", () => {
  const base = {
    walletPublicKey: "Wallet111",
    mintPublicKey: "Mint111",
    name: "My Game",
    symbol: "MYGAME",
    uri: "https://ipfs/meta.json",
    devBuySol: 0,
  };

  it("produces the exact PumpPortal 'create' payload with defaults", () => {
    expect(buildCreateBody(base)).toEqual({
      publicKey: "Wallet111",
      action: "create",
      tokenMetadata: { name: "My Game", symbol: "MYGAME", uri: "https://ipfs/meta.json" },
      mint: "Mint111",
      denominatedInSol: "true",
      amount: 0,
      slippage: 10,
      priorityFee: 0.0005,
      pool: "pump",
    });
  });

  it("passes through an initial buy and clamps negatives to zero", () => {
    expect(buildCreateBody({ ...base, devBuySol: 0.5 }).amount).toBe(0.5);
    expect(buildCreateBody({ ...base, devBuySol: -3 }).amount).toBe(0);
  });

  it("honours custom slippage and priority fee", () => {
    const body = buildCreateBody({ ...base, slippage: 25, priorityFee: 0.001 });
    expect(body.slippage).toBe(25);
    expect(body.priorityFee).toBe(0.001);
  });
});
