import ImageModule from '../ImageModule';

/**
 * A React Native DevTools request id for a request made while the caller is on the stack, or
 * `undefined` when DevTools is not attached. Native captures it where it can, so the initiator
 * omits this module's own frames; elsewhere `__NETWORK_REPORTER__` records it from here.
 */
export function captureDevToolsRequestId(): string | undefined {
  const capture = (ImageModule as { captureDevToolsRequestId?: () => string | null | undefined })
    .captureDevToolsRequestId;
  const id =
    typeof capture === 'function'
      ? capture()
      : globalThis.__NETWORK_REPORTER__?.createDevToolsRequestId();
  return typeof id === 'string' && id.length > 0 ? id : undefined;
}
