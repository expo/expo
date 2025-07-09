type EventListener = (...args: any[]) => void;

export class EventEmitterProxy {
  private moduleName: string;
  private listeners?: Map<string, Set<EventListener>>;

  constructor(moduleName: string) {
    this.moduleName = moduleName;
  }

  addListener = (eventName: string, listener: EventListener) => {
    if (!this.listeners) {
      this.listeners = new Map();
    }
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)?.add(listener);

    const nativeListenerId = window.ExpoDomWebView.nextEventListenerId++;
    (listener as any).$$nativeListenerId = nativeListenerId;

    const source = `
      globalThis.expo.$$DomWebViewEventListenerMap ||= {};
      globalThis.expo.$$DomWebViewEventListenerMap['${eventName}'] ||= new Map();
      const listener = (...args) => {
        const serializeArgs = args.map((arg) => JSON.stringify(arg)).join(',');
        const script = 'window.ExpoDomWebView.eventEmitterProxy.${this.moduleName}.emit("${eventName}", ' + serializeArgs + ')';
        globalThis.expo.modules.ExpoDomWebViewModule.evalJsForWebViewAsync("%%WEBVIEW_ID%%", script);
      };
      globalThis.expo.$$DomWebViewEventListenerMap['${eventName}'].set(${nativeListenerId}, listener);
      globalThis.expo.modules.${this.moduleName}.addListener('${eventName}', listener);
    `;
    window.ExpoDomWebView.eval(source);

    return {
      remove: () => {
        this.removeListener(eventName, listener);
      },
    };
  };

  removeListener = (eventName: string, listener: EventListener) => {
    const nativeListenerId = (listener as any).$$nativeListenerId;
    if (nativeListenerId != null) {
      const source = `(function() {
        const nativeListener = globalThis.expo.$$DomWebViewEventListenerMap['${eventName}'].get(${nativeListenerId});
        if (nativeListener != null) {
          globalThis.expo.modules.${this.moduleName}.removeListener('${eventName}', nativeListener);
          globalThis.expo.$$DomWebViewEventListenerMap['${eventName}'].delete(${nativeListenerId});
        }
      })();
      true;
      `;
      window.ExpoDomWebView.eval(source);
    }
    this.listeners?.get(eventName)?.delete(listener);
  };

  removeAllListeners = (eventName: string) => {
    const source = `
      globalThis.expo.$$DomWebViewEventListenerMap['${eventName}'].clear();
      globalThis.expo.modules.${this.moduleName}.removeAllListeners('${eventName}');
    `;
    window.ExpoDomWebView.eval(source);
    this.listeners?.get(eventName)?.clear();
  };

  emit = (eventName: string, ...args: any[]) => {
    const listeners = new Set(this.listeners?.get(eventName));

    listeners.forEach((listener) => {
      try {
        listener(...args);
      } catch (error) {
        console.error(error);
      }
    });
  };
}
