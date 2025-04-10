/* eslint-env browser */

// Setup websocket messages for reloading the page from the command line.
// This is normally setup on the native client.

const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const messageSocket = new WebSocket(`${protocol}://${window.location.host}/message`);
messageSocket.onmessage = (message) => {
  const data = JSON.parse(String(message.data));
  switch (data.method) {
    case 'sendDevCommand':
      switch (data.params.name) {
        case 'reload':
          window.location.reload();
          break;
        case 'rsc-reload':
          if (data.params.platform && data.params.platform !== process.env.EXPO_OS) {
            return;
          }
          globalThis.__EXPO_RSC_RELOAD_LISTENERS__?.forEach((l) => l());
          break;
        // Inject CSS modules from server components into the root client bundle in development.
        case 'module-import':
          {
            const { data: moduleData } = data.params;
            // remove element with the same 'expo-module-id'
            const id = `expo-module-id="${moduleData.id}"`;
            const style = document.querySelector(`style[${id}]`);
            document.querySelector(`script[${id}]`)?.remove();
            const code = moduleData.code;
            const script = document.createElement('script');
            script.type = 'module';
            script.text = code;
            script.setAttribute('expo-module-id', moduleData.id);
            document.head.appendChild(script);
            if (style) {
              // remove the previous block after the new one is loaded to mitigate FOUC.
              queueMicrotask(() => style.parentElement?.removeChild(style));
            }
          }
          break;
      }
      break;
    case 'reload':
      window.location.reload();
      break;
    case 'devMenu':
      // no-op
      break;
  }
};
