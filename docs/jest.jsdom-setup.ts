// jsdom implements neither IntersectionObserver nor requestIdleCallback, so next/link
// marks every link "visible" through a setTimeout-based polyfill. In async tests those
// timers fire outside act() and log an act() warning per rendered link. With this stub
// in place, next/link registers an observer whose callback never fires instead.
class IntersectionObserverStub {
  readonly root = null;
  readonly rootMargin = '0px';
  readonly thresholds: readonly number[] = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserverStub,
});

export {};
