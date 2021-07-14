import { ServerConfig, StoryHttpServer } from '../types';
declare function createFileWatcher(config: ServerConfig, server: StoryHttpServer): {
    cleanup: () => void;
};
export { createFileWatcher };
