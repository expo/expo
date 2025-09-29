export const getTextFromChildren = (children: React.ReactNode): string | undefined => {
  if (typeof children === 'string') {
    return children;
  }
  if (Array.isArray(children)) {
    return children.map(getTextFromChildren).join('');
  }
  return undefined;
};
