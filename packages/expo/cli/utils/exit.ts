/** Add functions that run before the process exits. Returns a function for removing the listeners. */
export function installExitHooks(listener: NodeJS.SignalsListener): () => void {
  const killSignals: ['SIGINT', 'SIGTERM'] = ['SIGINT', 'SIGTERM'];
  for (const signal of killSignals) {
    process.on(signal, listener);
  }
  return () => {
    for (const signal of killSignals) {
      process.off(signal, listener);
    }
  };
}
