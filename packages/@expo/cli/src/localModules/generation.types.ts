export type Event = {
  filePath: string;
  metadata?: {
    type: 'f' | 'd' | 'l'; // Regular file / Directory / Symlink
  } | null;
  type: string;
};

export type EventsQueue = Event[];
