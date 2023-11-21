import { ExponentFileSystemModule } from './types';

const platformModule: ExponentFileSystemModule = {
  get name(): 'ExponentFileSystem' {
    return 'ExponentFileSystem';
  },
  get documentDirectory(): string | null {
    return null;
  },
  get cacheDirectory(): string | null {
    return null;
  },
  get bundleDirectory(): string | null {
    return null;
  },
  addListener(eventName: string): void {},
  removeListeners(count: number): void {},
};

export default platformModule;
