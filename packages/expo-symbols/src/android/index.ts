/**
 * Regenerate this file using a request captured from https://fonts.google.com/icons and this script:
 * https://gist.github.com/aleqsio/63a2f378286c727780ef6056d66d8e43
 */
import symbols from './symbols.json';
export type AndroidSymbol = keyof typeof symbols;
export type AndroidSymbolWeight = {
  name: string;
  font: number;
};

export function androidSymbolToString(symbol: AndroidSymbol | null) {
  if (!symbol) return null;
  return String.fromCharCode(symbols[symbol]);
}
