import * as React from 'react';

import { copyToClipboardAsync } from '../native-modules/DevMenu';

export function useClipboard(clearInMillis: number = 3000) {
  const [clipboardContent, setClipboardContent] = React.useState('');
  const [clipboardError, setClipboardError] = React.useState('');

  const timerRef = React.useRef<ReturnType<typeof setTimeout>>();

  React.useEffect(() => {
    if (clipboardContent) {
      timerRef.current = setTimeout(() => {
        setClipboardContent('');
      }, clearInMillis);
    }

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [clipboardContent, clearInMillis]);

  async function onCopyPress(data: object | string) {
    let content;
    if (typeof data === 'object') {
      content = JSON.stringify(data, null, 2);
    } else {
      content = data;
    }

    setClipboardError('');
    setClipboardContent(content);

    await copyToClipboardAsync(content).catch((err) => {
      setClipboardError(err.message);
      setClipboardContent('');
    });
  }

  return {
    onCopyPress,
    clipboardContent,
    clipboardError,
  };
}
