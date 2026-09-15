import type { ModelSchema } from '../LanguageModels.types';
import { createOperation } from '../Operation';
import { generateValidated, runValidatedTools } from '../compatibility';
import type { CompatibilityOptions, CompatibilityTool } from '../compatibility';

const operations: ReturnType<typeof createOperation>[] = [];
const inputSchema: ModelSchema = {
  type: 'object',
  properties: { amount: { type: 'integer' } },
  required: ['amount'],
  additionalProperties: false,
};
const action = (id = 'one', amount: unknown = 1, name = 'save') =>
  JSON.stringify({ type: 'tool', id, name, arguments: { amount } });
const result = (value: unknown) => JSON.stringify({ type: 'result', value });

function setup(responses: (string | (() => Promise<string> | string))[], timeoutMs?: number) {
  const operation = createOperation(undefined, timeoutMs);
  operations.push(operation);
  let next = 0;
  const complete = jest.fn(async (_prompt: string): Promise<string> => {
    if (next >= responses.length) throw new Error('Unexpected extra completion.');
    const response = responses[next++]!;
    return typeof response === 'function' ? response() : response;
  });
  const options: CompatibilityOptions = {
    complete,
    operation,
    prompt: 'Test task.',
    schema: { type: 'string' },
  };
  const execute = jest.fn(
    async (_input: unknown, _context: { callId: string; signal: AbortSignal }) => 'saved'
  );
  const tool: CompatibilityTool = {
    name: 'save',
    description: 'Save the amount.',
    inputSchema,
    execute,
  };
  return { options, complete, execute, tool };
}
afterEach(() => {
  for (const operation of operations.splice(0)) operation.close();
});

describe('validated generation', () => {
  it('repairs malformed and schema-invalid output within the exact retry budget', async () => {
    for (const invalid of ['{broken', 'false']) {
      const { options, complete } = setup([invalid, '"ready"']);
      await expect(generateValidated(options)).resolves.toEqual({
        value: 'ready',
        modelCalls: 2,
        toolCalls: 0,
      });
      const transcript = JSON.parse(complete.mock.calls[1]![0]);
      expect(transcript.history.map((entry: { type: string }) => entry.type)).toEqual([
        'invalid-output',
        'repair',
      ]);
    }
  });

  it.each([0, 1, 2, 3])(
    'makes at most retries + 1 completions when maximumRetries is %i',
    async (maximumRetries) => {
      const { options, complete } = setup(Array(maximumRetries + 1).fill('bad'));
      await expect(generateValidated({ ...options, maximumRetries })).rejects.toMatchObject({
        code: 'ERR_VALIDATION_RETRIES_EXHAUSTED',
        cause: { code: 'ERR_RESPONSE_INVALID' },
      });
      expect(complete).toHaveBeenCalledTimes(maximumRetries + 1);
    }
  );

  it('checks every numeric bound before completing', async () => {
    const { options, complete } = setup([]);
    for (const [key, values] of [
      ['maximumRetries', [-1, 4, 0.5, null]],
      ['maximumSteps', [0, 33, Infinity, null]],
      ['maximumToolCalls', [-1, 17, NaN, null]],
    ] as const) {
      for (const value of values) {
        await expect(
          generateValidated({ ...options, [key]: value } as CompatibilityOptions)
        ).rejects.toMatchObject({ code: 'ERR_OPTIONS_INVALID' });
      }
    }
    expect(complete).not.toHaveBeenCalled();
  });

  it('rejects unsupported schemas before completing', async () => {
    const { options, complete } = setup([]);
    await expect(
      generateValidated({
        ...options,
        schema: { type: 'number', minimum: Infinity } as ModelSchema,
      })
    ).rejects.toMatchObject({ code: 'ERR_SCHEMA_UNSUPPORTED' });
    expect(complete).not.toHaveBeenCalled();
  });

  it('does not repair provider failures or non-string results', async () => {
    for (const [response, code] of [
      [
        () => {
          throw new Error('Unavailable.');
        },
        'ERR_COMPLETION_FAILED',
      ],
      [() => 42 as unknown as string, 'ERR_COMPLETION_INVALID'],
    ] as const) {
      const { options, complete } = setup([response]);
      await expect(generateValidated(options)).rejects.toMatchObject({ code });
      expect(complete).toHaveBeenCalledTimes(1);
    }
  });

  it('cancellation between attempts prevents another completion', async () => {
    const { options, complete } = setup([
      () => {
        options.operation.abort();
        return 'bad';
      },
    ]);
    await expect(generateValidated(options)).rejects.toMatchObject({ code: 'ERR_ABORTED' });
    expect(complete).toHaveBeenCalledTimes(1);
  });
});

describe('validated tool loop', () => {
  it('validates arguments before interception, tool events, or handler execution', async () => {
    const { options, tool, execute } = setup([action('one', 'wrong')]);
    const beforeTool = jest.fn();
    const onToolStart = jest.fn();
    await expect(
      runValidatedTools({ ...options, maximumRetries: 0, tools: [tool], beforeTool, onToolStart })
    ).rejects.toMatchObject({ code: 'ERR_VALIDATION_RETRIES_EXHAUSTED' });
    expect(beforeTool).not.toHaveBeenCalled();
    expect(onToolStart).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it('repairs arguments before dispatch and emits exactly one start/end pair', async () => {
    const { options, tool, execute } = setup([action('one', 'wrong'), action(), result('done')]);
    const onToolStart = jest.fn();
    const onToolEnd = jest.fn();
    await expect(
      runValidatedTools({ ...options, tools: [tool], onToolStart, onToolEnd })
    ).resolves.toEqual({ value: 'done', modelCalls: 3, toolCalls: 1 });
    expect(execute).toHaveBeenCalledWith(
      { amount: 1 },
      { callId: 'one', signal: options.operation.signal }
    );
    expect(onToolStart).toHaveBeenCalledWith({ callId: 'one', toolName: 'save' });
    expect(onToolEnd).toHaveBeenCalledWith({ callId: 'one', toolName: 'save' });
    expect(onToolStart).toHaveBeenCalledTimes(1);
    expect(onToolEnd).toHaveBeenCalledTimes(1);
  });

  it('never dispatches unregistered or duplicate tool names', async () => {
    const { options, tool, execute } = setup([action('one', 1, '__proto__')]);
    await expect(
      runValidatedTools({ ...options, maximumRetries: 0, tools: [tool] })
    ).rejects.toMatchObject({ code: 'ERR_VALIDATION_RETRIES_EXHAUSTED' });
    expect(execute).not.toHaveBeenCalled();
    await expect(runValidatedTools({ ...options, tools: [tool, tool] })).rejects.toMatchObject({
      code: 'ERR_OPTIONS_INVALID',
    });
  });

  it.each([false, undefined])('fails closed for a non-approval decision: %p', async (decision) => {
    const { options, tool, execute, complete } = setup([action()]);
    await expect(
      runValidatedTools({ ...options, tools: [tool], beforeTool: () => decision as boolean })
    ).rejects.toMatchObject({
      code: decision === false ? 'ERR_TOOL_DENIED' : 'ERR_TOOL_DECISION_INVALID',
    });
    expect(execute).not.toHaveBeenCalled();
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('approval receives an independent copy of validated arguments', async () => {
    const { options, tool, execute } = setup([action(), result('done')]);
    await runValidatedTools({
      ...options,
      tools: [tool],
      beforeTool: (context) => {
        (context.arguments as { amount: number }).amount = 999;
        return true;
      },
    });
    expect(execute.mock.calls[0]![0]).toEqual({ amount: 1 });
  });

  it('never replays a completed call when later output requires repair', async () => {
    const { options, tool, execute, complete } = setup([action(), 'bad', action()]);
    await expect(runValidatedTools({ ...options, tools: [tool] })).rejects.toMatchObject({
      code: 'ERR_TOOL_CALL_REPLAY',
    });
    expect(execute).toHaveBeenCalledTimes(1);
    const transcript = JSON.parse(complete.mock.calls[2]![0]);
    expect(transcript.history[0]).toMatchObject({
      type: 'completed-tool',
      id: 'one',
      output: 'saved',
    });
  });

  it('preserves completed observations while repairing the final result', async () => {
    const { options, tool, execute } = setup([action(), 'bad', result('done')]);
    await expect(runValidatedTools({ ...options, tools: [tool] })).resolves.toMatchObject({
      value: 'done',
      toolCalls: 1,
    });
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('never repairs callback or handler failures', async () => {
    for (const phase of ['beforeTool', 'onToolStart', 'execute', 'onToolEnd'] as const) {
      const { options, tool, execute, complete } = setup([action()]);
      const failure = async () => {
        throw new Error('Application callback failed.');
      };
      const overrides =
        phase === 'execute'
          ? { tools: [{ ...tool, execute: failure }] }
          : { tools: [tool], [phase]: failure };
      const code =
        phase === 'execute'
          ? 'ERR_TOOL_FAILED'
          : phase === 'beforeTool'
            ? 'ERR_TOOL_DECISION_FAILED'
            : 'ERR_TOOL_EVENT_FAILED';
      await expect(runValidatedTools({ ...options, ...overrides })).rejects.toMatchObject({ code });
      expect(complete).toHaveBeenCalledTimes(1);
      expect(execute).toHaveBeenCalledTimes(phase === 'onToolEnd' ? 1 : 0);
    }
  });

  it('rejects invalid handler output without retrying the side effect', async () => {
    const { options, tool, complete } = setup([action()]);
    const execute = jest.fn(async () => undefined as unknown as string);
    await expect(
      runValidatedTools({ ...options, tools: [{ ...tool, execute }] })
    ).rejects.toMatchObject({ code: 'ERR_TOOL_FAILED' });
    expect(execute).toHaveBeenCalledTimes(1);
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it.each([0, 1])(
    'checks maximumToolCalls=%i before another handler starts',
    async (maximumToolCalls) => {
      const { options, tool, execute } = setup([action('one'), action('two')]);
      await expect(
        runValidatedTools({ ...options, tools: [tool], maximumToolCalls })
      ).rejects.toMatchObject({ code: 'ERR_TOOL_CALL_LIMIT' });
      expect(execute).toHaveBeenCalledTimes(maximumToolCalls);
    }
  );

  it('repairs consume the same completion budget as tool actions', async () => {
    const { options, complete } = setup(['bad']);
    await expect(runValidatedTools({ ...options, maximumSteps: 1 })).rejects.toMatchObject({
      code: 'ERR_STEP_LIMIT',
    });
    expect(complete).toHaveBeenCalledTimes(1);
    const last = setup([action()]);
    await expect(
      runValidatedTools({ ...last.options, tools: [last.tool], maximumSteps: 1 })
    ).rejects.toMatchObject({ code: 'ERR_STEP_LIMIT' });
    expect(last.execute).not.toHaveBeenCalled();
  });

  it('a synchronous approval exceeding the deadline cannot start a handler', async () => {
    const { options, tool, execute, complete } = setup([action()], 5);
    await expect(
      runValidatedTools({
        ...options,
        tools: [tool],
        beforeTool: () => {
          const until = performance.now() + 15;
          while (performance.now() < until) {
            /* Simulate a synchronous application callback. */
          }
          return true;
        },
      })
    ).rejects.toMatchObject({ code: 'ERR_TIMEOUT' });
    expect(execute).not.toHaveBeenCalled();
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('cancellation in a start event prevents the handler from running', async () => {
    const { options, tool, execute } = setup([action()]);
    await expect(
      runValidatedTools({ ...options, tools: [tool], onToolStart: () => options.operation.abort() })
    ).rejects.toMatchObject({ code: 'ERR_ABORTED' });
    expect(execute).not.toHaveBeenCalled();
  });

  it('deep invalid result values are repaired without reserializing them', async () => {
    const deep = '{"type":"result","value":' + '['.repeat(5000) + '0' + ']'.repeat(5000) + '}';
    const { options } = setup([deep, result('done')]);
    await expect(runValidatedTools(options)).resolves.toMatchObject({
      value: 'done',
      modelCalls: 2,
    });
  });
});
