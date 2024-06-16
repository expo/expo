import { isInteractive } from '../../utils/interactive';
import { openBrowserAsync } from '../../utils/open';
import { registerAsync } from '../registerAsync';

jest.mock('../../utils/open');
jest.mock('../../utils/interactive', () => ({
  isInteractive: jest.fn(() => true),
}));

const originalEnv = process.env;
beforeEach(() => {
  delete process.env.EXPO_OFFLINE;
  delete process.env.CI;
});

afterAll(() => {
  process.env = originalEnv;
});

it(`asserts that registration is not supported in offline-mode`, async () => {
  process.env.EXPO_OFFLINE = '1';
  await expect(registerAsync()).rejects.toThrowErrorMatchingInlineSnapshot(
    `"Cannot register an account in offline-mode"`
  );
  expect(openBrowserAsync).not.toBeCalled();
});

it(`asserts that registration is not supported in non-interactive environments`, async () => {
  jest.mocked(isInteractive).mockReturnValueOnce(false);

  await expect(registerAsync()).rejects.toThrow(
    expect.objectContaining({
      name: 'CommandError',
      message: expect.stringContaining('Cannot register an account in CI.'),
    })
  );

  expect(openBrowserAsync).not.toBeCalled();
});

it(`launches a registration window`, async () => {
  jest.mocked(isInteractive).mockReturnValueOnce(true);

  await registerAsync();

  expect(openBrowserAsync).toBeCalledWith('https://expo.dev/signup');
});
