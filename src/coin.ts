/**
 * $GAME — Aethera's token on Pump.fun.
 *
 * Pump.fun mints the contract address (CA) when the coin is created, so it
 * isn't known until launch. After you create $GAME, paste its mint address
 * here and the whole site (nav, coin band, footer) lights up with the live CA,
 * copy button and Pump.fun / Solscan links.
 */
export const GAME = {
  ticker: "$GAME",
  /** Pump.fun token symbol (no leading $). */
  symbol: "GAME",
  /** The mint address. Leave empty until launch. */
  contractAddress: "",
};

export const hasGameCA = (): boolean => GAME.contractAddress.trim().length > 0;

export const pumpFunCoinUrl = (mint: string): string => `https://pump.fun/coin/${mint}`;
export const solscanTokenUrl = (mint: string): string => `https://solscan.io/token/${mint}`;

/** Where the "Buy $GAME" buttons point. */
export const buyGameUrl = (): string =>
  hasGameCA() ? pumpFunCoinUrl(GAME.contractAddress) : "https://pump.fun";

export function shortAddress(addr: string, lead = 4, tail = 4): string {
  if (addr.length <= lead + tail + 1) return addr;
  return `${addr.slice(0, lead)}…${addr.slice(-tail)}`;
}
