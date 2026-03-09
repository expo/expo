export const Children = {
  toArray(children: unknown) {
    if (children === undefined || children === null) {
      return [];
    }
    return Array.isArray(children) ? children : [children];
  },
};
export const isValidElement = (value: unknown) => {
  return Boolean(value) && typeof value === 'object' && 'type' in (value as object);
};
