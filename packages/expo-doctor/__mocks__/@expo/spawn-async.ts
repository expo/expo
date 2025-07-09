import { SpawnResult } from '@expo/spawn-async';

export default jest.fn(
  async (): Promise<SpawnResult> => ({
    pid: 1,
    output: [],
    stdout: '',
    stderr: '',
    status: 0,
    signal: null,
  })
);
