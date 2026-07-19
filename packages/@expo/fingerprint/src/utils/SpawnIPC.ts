import spawnAsync, {
  type SpawnOptions,
  type SpawnPromise,
  type SpawnResult,
} from '@expo/spawn-async';
import assert from 'node:assert';

interface SpawnWithIpcResult extends SpawnResult {
  message: string;
}

export async function spawnWithIpcAsync(
  command: string,
  args?: string[],
  options?: SpawnOptions
  // @ts-expect-error: spawnAsync returns a customized Promise
): SpawnPromise<SpawnWithIpcResult> {
  assert(options?.stdio == null, 'Cannot override stdio when using IPC');

  const promise = spawnAsync(command, args, {
    ...options,
    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
  });

  const messageChunks: string[] = [];
  const appendMessage = (message: any) => {
    messageChunks.push(message);
  };
  promise.child.on('message', appendMessage);
  const result = await promise;
  promise.child.off('message', appendMessage);
  return {
    ...result,
    message: messageChunks.join(''),
  };
}
