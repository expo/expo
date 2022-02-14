import { execAsync } from '@expo/osascript';

import { simctlAsync } from '../../../platforms/ios/simctl';
import { SimulatorAppPrerequisite } from '../SimulatorAppPrerequisite';

const asMock = (fn: any): jest.Mock => fn;

jest.mock(`../../../../log`);

jest.mock('../../../platforms/ios/simctl', () => {
  return {
    simctlAsync: jest.fn(),
  };
});

jest.mock(`@expo/osascript`);

beforeEach(() => {
  jest.mock('../../../../utils/prompts').resetAllMocks();
  jest.mock('@expo/osascript').resetAllMocks();
  jest.mock('../../../platforms/ios/simctl').resetAllMocks();
});

it(`detects that Simulator.app is installed`, async () => {
  // Mock Simulator.app installed for CI
  asMock(execAsync).mockReturnValueOnce(`com.apple.CoreSimulator.SimulatorTrampoline`);
  asMock(simctlAsync).mockReturnValueOnce(`usage: ...`);

  await SimulatorAppPrerequisite.instance.assertImplementation();

  expect(execAsync).toBeCalledWith('id of app "Simulator"');
  expect(simctlAsync).toBeCalledWith(['help']);
});

it(`asserts that Simulator.app is installed with invalid Simulator.app`, async () => {
  // Mock Simulator.app installed with invalid binary
  asMock(execAsync).mockReturnValueOnce(`com.apple.CoreSimulator.bacon`);

  await expect(SimulatorAppPrerequisite.instance.assertImplementation()).rejects.toThrow(/\.bacon/);
  expect(simctlAsync).not.toBeCalled();
});

it(`asserts that Simulator.app is installed but simctl doesn't work`, async () => {
  // Mock Simulator.app installed for CI
  asMock(execAsync).mockReturnValueOnce(`com.apple.CoreSimulator.SimulatorTrampoline`);
  asMock(simctlAsync).mockImplementationOnce(() => {
    throw new Error('foobar');
  });

  await expect(SimulatorAppPrerequisite.instance.assertImplementation()).rejects.toThrow(
    /xcrun may not be configured correctly/
  );
});
