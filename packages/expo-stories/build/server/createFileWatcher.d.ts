import { IServerConfig, IStoryHttpServer } from '../types';
declare function createFileWatcher(config: IServerConfig, server: IStoryHttpServer): {
    cleanup: () => void;
};
export { createFileWatcher };
