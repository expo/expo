import { OrientationConstant } from './Print.types';

export default {
  get name(): string {
    return 'ExponentPrint';
  },
  get Orientation(): OrientationConstant {
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
