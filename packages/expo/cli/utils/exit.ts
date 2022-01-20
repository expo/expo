export function installExitHooks(listener: NodeJS.SignalsListener) {
  const killSignals: ['SIGINT', 'SIGTERM'] = ['SIGINT', 'SIGTERM'];
  for (const signal of killSignals) {
    process.on(signal, listener);
  }
}
