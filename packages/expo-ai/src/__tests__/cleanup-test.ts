import NativeModule from '../ExpoAI';
import type { NativeSession } from '../NativeLanguageModels.types';
import { createSessionAsync, generateAsync, LanguageModelError, schema } from '../index';
import { availableModel, FakeSession } from './fixtures/FakeSession';

jest.mock('../ExpoAI', () => ({
  __esModule: true,
  default: { getAvailabilityAsync: jest.fn(), createSessionAsync: jest.fn() },
}));

const nativeModule = jest.mocked(NativeModule!);
let native: FakeSession;
const flush = async () => {
  for (let index = 0; index < 40; index++) await Promise.resolve();
};

beforeEach(() => {
  native = new FakeSession();
  nativeModule.getAvailabilityAsync.mockReset().mockResolvedValue(availableModel());
  nativeModule.createSessionAsync.mockReset().mockResolvedValue(native);
});
afterEach(() => jest.restoreAllMocks());

it('releases native ownership when disposal throws and remains idempotent', async () => {
  const cause = new Error('Native disposal failed.');
  native.dispose.mockImplementation(() => {
    throw cause;
  });
  const session = await createSessionAsync();
  expect(() => session.dispose()).toThrow(
    expect.objectContaining({ code: 'ERR_GENERATION_FAILED', cause })
  );
  expect(native.dispose).toHaveBeenCalledTimes(1);
  expect(native.release).toHaveBeenCalledTimes(1);
  expect(() => session.dispose()).not.toThrow();
  expect(native.release).toHaveBeenCalledTimes(1);
});

it('attempts every subscription removal and native release when one removal throws', async () => {
  const cause = new Error('Text subscription removal failed.');
  const addListener = native.addListener.bind(native);
  const removals: jest.Mock[] = [];
  jest.spyOn(native, 'addListener').mockImplementation((event, listener) => {
    const subscription = addListener(event, listener);
    const remove = jest.fn(() => {
      subscription.remove();
      if (event === 'onText') throw cause;
      return true;
    });
    removals.push(remove);
    return { remove };
  });
  native.generateAsync.mockImplementation(() => new Promise(() => {}));
  const session = await createSessionAsync();
  const task = session.generateAsync('Wait for the model.');
  const rejected = expect(task).rejects.toMatchObject({
    code: 'ERR_SESSION_DISPOSED',
  });
  await flush();
  expect(native.listenerCount).toBe(2);
  expect(() => session.dispose()).toThrow(expect.objectContaining({ cause }));
  await rejected;
  expect(removals).toHaveLength(2);
  for (const remove of removals) expect(remove).toHaveBeenCalledTimes(1);
  expect(native.listenerCount).toBe(0);
  expect(native.dispose).toHaveBeenCalledTimes(1);
  expect(native.release).toHaveBeenCalledTimes(1);
});

it('preserves the completion failure while releasing a compatibility session whose disposal throws', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(
    availableModel({
      constrainedOutput: 'unsupported',
      runtimeToolDeclarations: 'unsupported',
    })
  );
  const generationCause = Object.assign(new Error('The model refused this request.'), {
    code: 'ERR_MODEL_REFUSAL',
  });
  const cleanupCause = new Error('Compatibility disposal failed.');
  const completion = new FakeSession();
  completion.generateAsync.mockRejectedValue(generationCause);
  completion.dispose.mockImplementation(() => {
    throw cleanupCause;
  });
  nativeModule.createSessionAsync.mockResolvedValueOnce(native).mockResolvedValueOnce(completion);
  const session = await createSessionAsync();
  const error = await session
    .generateAsync('Categorize.', { schema: schema.string() })
    .catch((error) => error);
  expect(error).toBeInstanceOf(LanguageModelError);
  expect(error).toMatchObject({
    code: 'ERR_MODEL_REFUSAL',
    cause: generationCause,
  });
  expect(completion.dispose).toHaveBeenCalledTimes(1);
  expect(completion.release).toHaveBeenCalledTimes(1);
  session.dispose();
});

it('releases a canceled compatibility session that finishes opening even when its disposal throws', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(
    availableModel({
      constrainedOutput: 'unsupported',
      runtimeToolDeclarations: 'unsupported',
    })
  );
  let finishOpening!: (session: NativeSession) => void;
  nativeModule.createSessionAsync.mockResolvedValueOnce(native).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finishOpening = resolve;
      })
  );
  const session = await createSessionAsync();
  const controller = new AbortController();
  const task = session.generateAsync('Categorize.', {
    schema: schema.string(),
    signal: controller.signal,
  });
  const rejected = expect(task).rejects.toMatchObject({ code: 'ERR_ABORTED' });
  await flush();
  expect(nativeModule.createSessionAsync).toHaveBeenCalledTimes(2);
  controller.abort();
  await rejected;
  const late = new FakeSession();
  late.dispose.mockImplementation(() => {
    throw new Error('Late disposal failed.');
  });
  finishOpening(late);
  await flush();
  expect(late.dispose).toHaveBeenCalledTimes(1);
  expect(late.release).toHaveBeenCalledTimes(1);
  expect(late.generateAsync).not.toHaveBeenCalled();
  session.dispose();
});

it('removes the first listener if registration of the second listener fails', async () => {
  const cause = new Error('The tool listener could not be registered.');
  const addListener = native.addListener.bind(native);
  const remove = jest.fn();
  jest.spyOn(native, 'addListener').mockImplementation((event, listener) => {
    if (event === 'onToolCall') throw cause;
    const subscription = addListener(event, listener);
    remove.mockImplementation(() => subscription.remove());
    return { remove };
  });
  const session = await createSessionAsync();
  await expect(session.generateAsync('Generate.')).rejects.toMatchObject({
    code: 'ERR_GENERATION_FAILED',
    cause,
  });
  expect(remove).toHaveBeenCalledTimes(1);
  expect(native.listenerCount).toBe(0);
  expect(native.generateAsync).not.toHaveBeenCalled();
  session.dispose();
  expect(remove).toHaveBeenCalledTimes(1);
  expect(native.release).toHaveBeenCalledTimes(1);
});

it('preserves a one-shot generation error when its owned session also fails disposal', async () => {
  const generationCause = Object.assign(new Error('Model assets are no longer ready.'), {
    code: 'ERR_MODEL_NOT_READY',
  });
  native.generateAsync.mockRejectedValue(generationCause);
  native.dispose.mockImplementation(() => {
    throw new Error('Owned disposal failed.');
  });
  await expect(generateAsync('Generate.')).rejects.toMatchObject({
    code: 'ERR_MODEL_NOT_READY',
    cause: generationCause,
  });
  expect(native.dispose).toHaveBeenCalledTimes(1);
  expect(native.release).toHaveBeenCalledTimes(1);
  expect(native.listenerCount).toBe(0);
});
