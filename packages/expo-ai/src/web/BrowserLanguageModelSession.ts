import { LanguageModelError } from '../LanguageModelError';
import type { NativeSession, NativeTextEvent } from '../NativeLanguageModels.types';
import { createOperation, type Operation } from '../Operation';
import { compileSchema, parseResponse } from '../schema';
import type { BrowserLanguageModel } from './BrowserLanguageModel.types';
import { browserError, destroyModel, readOptions } from './utils';

export class BrowserLanguageModelSession implements NativeSession {
  private active?: {
    id: string;
    operation: Operation;
    model?: BrowserLanguageModel;
  };
  private pending?: { id: string; model: BrowserLanguageModel };
  private disposed = false;
  private listeners = new Map<string, Set<(event: never) => void>>();

  constructor(private model: BrowserLanguageModel) {}

  addListener(event: string, listener: (event: never) => void) {
    const listeners = this.listeners.get(event) ?? new Set();
    listeners.add(listener);
    this.listeners.set(event, listeners);
    return {
      remove: () => {
        listeners.delete(listener);
      },
    };
  }

  async generateAsync(requestId: string, prompt: string, optionsJSON: string): Promise<string> {
    if (this.disposed)
      throw new LanguageModelError('ERR_SESSION_DISPOSED', 'The session is disposed.');
    if (this.active || this.pending)
      throw new LanguageModelError('ERR_SESSION_BUSY', 'The session has an unresolved request.');
    const options = readOptions(optionsJSON);
    if (options.maximumOutputTokens !== undefined) {
      throw new LanguageModelError(
        'ERR_UNSUPPORTED_FEATURE',
        'The browser Prompt API cannot set maximumOutputTokens.'
      );
    }
    // Public schemas have already been checked; internal tool envelopes add up to two levels.
    const schema = options.schema === undefined ? undefined : compileSchema(options.schema, 2);
    const operation = createOperation();
    const active: NonNullable<BrowserLanguageModelSession['active']> = {
      id: requestId,
      operation,
    };
    this.active = active;
    const releaseWorkingModel = () => {
      const model = active.model;
      active.model = undefined;
      destroyModel(model);
    };
    const abort = () => releaseWorkingModel();
    operation.signal.addEventListener('abort', abort, { once: true });
    const overflow = () =>
      operation.abort(
        new LanguageModelError(
          'ERR_CONTEXT_WINDOW_EXCEEDED',
          'The browser session would discard previous conversation turns.'
        )
      );
    try {
      // A working clone prevents canceled, invalid, or failed generations from changing history.
      const model = await operation.run(() =>
        this.model.clone({ signal: operation.signal }).then((clone) => {
          if (operation.signal.aborted) destroyModel(clone);
          else active.model = clone;
          return clone;
        })
      );
      let text = '';
      try {
        model.addEventListener('contextoverflow', overflow);
        const promptOptions = {
          signal: operation.signal,
          ...(schema && { responseConstraint: schema }),
        };
        if (options.stream === true) {
          const reader = model.promptStreaming(prompt, promptOptions).getReader();
          try {
            while (true) {
              const chunk = await operation.run(() => reader.read());
              if (chunk.done) break;
              if (typeof chunk.value !== 'string')
                throw new LanguageModelError(
                  'ERR_PROVIDER_RESPONSE_INVALID',
                  'The browser returned a non-text stream chunk.'
                );
              text += chunk.value;
              const event: NativeTextEvent = { requestId, text };
              this.listeners.get('onText')?.forEach((listener) => listener(event as never));
            }
          } finally {
            if (operation.signal.aborted) reader.cancel().catch(() => {});
            reader.releaseLock();
          }
        } else {
          text = await operation.run(() => model.prompt(prompt, promptOptions));
          if (typeof text !== 'string')
            throw new LanguageModelError(
              'ERR_PROVIDER_RESPONSE_INVALID',
              'The browser did not return text.'
            );
        }
        if (schema) parseResponse(text, schema, 2);
      } finally {
        model.removeEventListener('contextoverflow', overflow);
      }
      operation.check();
      // JavaScript still needs to validate and accept the completed request.
      // Transfer the clone to pending ownership without changing committed history.
      this.pending = { id: requestId, model };
      active.model = undefined;
      return JSON.stringify({ text, usage: { inputTokens: null, outputTokens: null } });
    } catch (cause) {
      operation.check();
      const error = browserError(cause, 'ERR_GENERATION_FAILED');
      operation.abort(error);
      throw error;
    } finally {
      operation.signal.removeEventListener('abort', abort);
      releaseWorkingModel();
      operation.close();
      if (this.active === active) this.active = undefined;
    }
  }

  cancel(requestId: string): void {
    this.discardResult(requestId);
  }

  acceptResult(requestId: string): boolean {
    if (this.disposed || this.active || this.pending?.id !== requestId) return false;
    const pending = this.pending;
    this.pending = undefined;
    const previous = this.model;
    this.model = pending.model;
    destroyModel(previous);
    return true;
  }

  discardResult(requestId: string): void {
    if (this.active?.id === requestId) this.active.operation.abort();
    if (this.pending?.id !== requestId) return;
    const pending = this.pending;
    this.pending = undefined;
    destroyModel(pending.model);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.active?.operation.abort(
      new LanguageModelError('ERR_SESSION_DISPOSED', 'The session is disposed.')
    );
    if (this.pending) this.discardResult(this.pending.id);
    destroyModel(this.model);
    this.listeners.clear();
  }

  release(): void {
    this.dispose();
  }
  resolveTool(): boolean {
    return false;
  }
}
