import { render } from '@testing-library/react-native';

const originalEnv = process.env.NODE_ENV;

afterEach(() => {
  process.env.NODE_ENV = originalEnv;
});

it('renders nothing on web, even in development', () => {
  process.env.NODE_ENV = 'development';
  let ScrollViewPathDetector: typeof import('../ScrollViewPathDetector').ScrollViewPathDetector;
  jest.isolateModules(() => {
    ({ ScrollViewPathDetector } = require('../ScrollViewPathDetector'));
  });
  const Detector = ScrollViewPathDetector!;
  const { toJSON } = render(<Detector routeName="index" />);
  expect(toJSON()).toBeNull();
});
