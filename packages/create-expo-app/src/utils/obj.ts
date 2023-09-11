export function deepMerge(target: any, source: any) {
  if (typeof target !== 'object') {
    return source;
  }
  if (Array.isArray(target) && Array.isArray(source)) {
    return target.concat(source);
  }
  Object.keys(source).forEach(key => {
    if (typeof source[key] === 'object' && source[key] !== null) {
      target[key] = deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  });
  return target;
}
