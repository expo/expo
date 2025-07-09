import { Manifest } from './Manifest';

export type HistoryItem = {
  manifestUrl: string;
  manifest?: Manifest;
  url: string; // Same as manifestUrl
  time: number;
};
