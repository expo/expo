import React from 'react';
import ReactDOM from 'react-dom/client';

export function renderInShadowRoot(
  id: string,
  element: React.ReactNode
): {
  unmount: () => void;
} {
  const div = document.createElement('div');
  div.id = id;
  document.body.appendChild(div);

  const shadowRoot = div.attachShadow({ mode: 'open' });

  document.querySelectorAll('style').forEach((styleEl) => {
    const moduleName = styleEl.getAttribute('data-expo-css-hmr');
    const isLogBoxStyle = moduleName && moduleName.includes('expo_log_box');

    const isReactNativeStyle = styleEl.id === 'react-native-stylesheet';

    if (isLogBoxStyle || isReactNativeStyle) {
      shadowRoot.appendChild(styleEl.cloneNode(true));
    }
  });

  const shadowContainer = document.createElement('div');
  shadowRoot.appendChild(shadowContainer);

  let currentRoot: ReactDOM.Root | null = ReactDOM.createRoot(shadowContainer);
  currentRoot.render(element);

  return {
    unmount: () => {
      currentRoot?.unmount();
      currentRoot = null;
      document.getElementById(id)?.remove();
    },
  };
}
