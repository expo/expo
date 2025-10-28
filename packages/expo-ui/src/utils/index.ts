export const getTextFromChildren = (children: React.ReactNode): string | undefined => {
  if (typeof children === 'string') {
    return children;
  }
  if (typeof children === 'number') {
    return children.toString();
  }
  if (Array.isArray(children)) {
    return children.map(getTextFromChildren).join('');
  }
  return undefined;
};
