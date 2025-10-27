import type { ContextMarker } from './AskPageAIChat.types';

export const normalizeQuestion = (question: string) => question.trim().toLowerCase();

export const createMarkerMap = (markers: ContextMarker[]) => {
  const map: Record<number, ContextMarker[]> = {};
  for (const marker of markers) {
    if (!map[marker.at]) {
      map[marker.at] = [];
    }
    map[marker.at].push(marker);
  }
  return map;
};
