export const startDevToolsPluginListenerAsync = async (
  _pluginName: string
): Promise<{
  addMessageListener: <P extends Record<string, string>>(
    eventName: string,
    callback: (arg: { params: P; sendResponseAsync: (message: string) => Promise<void> }) => void
  ) => void;
  sendMessageAsync: (eventName: string, message: string) => Promise<void>;
}> => {
  throw new Error(
    'This function is not supported on this platform. Please use the native version instead.'
  );
};
