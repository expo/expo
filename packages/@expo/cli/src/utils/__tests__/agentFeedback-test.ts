import { installAgentFeedback, printAgentFeedback } from '../agentFeedback';
import { isInteractive } from '../interactive';
import { getAgentTelemetryContext } from '../telemetry/utils/agent';

jest.mock('../interactive');
jest.mock('../telemetry/utils/agent');

const mockIsInteractive = jest.mocked(isInteractive);
const mockGetAgentTelemetryContext = jest.mocked(getAgentTelemetryContext);

beforeEach(() => {
  mockIsInteractive.mockReturnValue(false);
  mockGetAgentTelemetryContext.mockReturnValue({ id: 'codex', sessionId: undefined });
});

afterEach(() => {
  jest.restoreAllMocks();
});

it('prints a compact feedback command when an agent exits in non-interactive mode', () => {
  const once = jest.spyOn(process, 'once').mockImplementation(() => process);
  const write = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

  installAgentFeedback('export');

  expect(once).toHaveBeenCalledWith('exit', expect.any(Function));
  const onExit = once.mock.calls[0]![1]! as () => void;
  onExit();
  expect(write).toHaveBeenCalledWith(
    '\nExpo CLI issue? Report it: npx --yes submit-expo-feedback@latest --category expo-cli --subject "export" "<what happened and how to reproduce>"\n'
  );
});

it('prints feedback once when a long-running command is ready', () => {
  const once = jest.spyOn(process, 'once').mockImplementation(() => process);
  const removeListener = jest.spyOn(process, 'removeListener').mockImplementation(() => process);
  const write = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

  installAgentFeedback('start');
  const onExit = once.mock.calls[0]![1]! as () => void;
  printAgentFeedback();
  onExit();

  expect(removeListener).toHaveBeenCalledWith('exit', onExit);
  expect(write).toHaveBeenCalledTimes(1);
  expect(write).toHaveBeenCalledWith(
    '\nExpo CLI issue? Report it: npx --yes submit-expo-feedback@latest --category expo-cli --subject "start" "<what happened and how to reproduce>"\n'
  );
});

it('does not install the footer in interactive mode', () => {
  mockIsInteractive.mockReturnValue(true);
  const once = jest.spyOn(process, 'once').mockImplementation(() => process);

  installAgentFeedback('export');

  expect(once).not.toHaveBeenCalled();
});

it('does not install the footer when no agent is detected', () => {
  mockGetAgentTelemetryContext.mockReturnValue(null);
  const once = jest.spyOn(process, 'once').mockImplementation(() => process);

  installAgentFeedback('export');

  expect(once).not.toHaveBeenCalled();
});
