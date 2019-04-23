import { OrientationType } from './Print.types';

export default {
  get name(): string {
    return 'ExponentPrint';
  },
  get Orientation(): OrientationType {
    return {
      portrait: 'portrait',
      landscape: 'landscape',
    };
  },
  async print(): Promise<void> {
    window.print();
  },
  async printToFileAsync(): Promise<void> {
    window.print();
  },
};
