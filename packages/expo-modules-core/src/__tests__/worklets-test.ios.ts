import { installOnUIRuntime } from '../worklets';

const mockRegisterCustomSerializable = jest.fn();

jest.mock('react-native-worklets', () => ({
  registerCustomSerializable: mockRegisterCustomSerializable,
}));

const originalExpo = globalThis.expo;

afterEach(() => {
  globalThis.expo = originalExpo;
});

it(`doesn't match a value in a runtime without Expo Modules`, () => {
  globalThis.expo = { installOnUIRuntime: jest.fn() } as any;
  installOnUIRuntime({});
  const { determine } = mockRegisterCustomSerializable.mock.calls[0][0];

  // A worklet runtime that `createWorkletRuntime` creates has no `globalThis.expo`.
  globalThis.expo = undefined as any;

  expect(determine({})).toBe(false);
});
