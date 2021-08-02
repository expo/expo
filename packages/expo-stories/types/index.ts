export interface ServerConfig {
  projectRoot: string;
  port: number;
  watchRoot: string;
}

export interface StoryManifest {
  files: Record<string, StoryManifestItem>;
}

export interface StoryManifestItem {
  id: string;
  fullPath: string;
  relativePath: string;
  title: string;
  stories: any[];
}

export interface StoryHttpServer {
  refreshClients: () => void;
  start: () => void;
  cleanup: () => void;
}
