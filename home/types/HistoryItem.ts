import { Manifest } from './Manifest';

export type HistoryItem = {
  bundleUrl: string;
  manifestUrl: string;
  manifest?: Manifest;
  url: string; // Same as manifestUrl
  time: number;
};
