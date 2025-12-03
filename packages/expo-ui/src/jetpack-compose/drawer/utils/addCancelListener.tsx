export const addCancelListener = (callback: () => boolean) => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      callback();
    }
  };

  document?.body?.addEventListener?.('keyup', handleEscape);

  return () => {
    document?.body?.removeEventListener?.('keyup', handleEscape);
  };
};
