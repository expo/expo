const Controller = globalThis.AbortController;

/** Models the reason-less AbortController supplied by React Native. */
export class LegacyAbortController extends Controller {
  constructor() {
    super();
    Object.defineProperty(this.signal, 'reason', { value: undefined });
  }

  abort(): void {
    super.abort();
  }
}
