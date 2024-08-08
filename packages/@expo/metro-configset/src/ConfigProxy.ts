type ConfigProxyOptions<T extends object = object> = {
  parentKey?: string;
  onSet(target: keyof T, property: string, value: unknown, parentKey?: string): void;
  onDelete(target: keyof T, property: string, parentKey?: string): void;
};

export function createConfigProxy(target: any, options: ConfigProxyOptions<any>) {
  return new Proxy(target, createProxyHandler(options));
}

function createProxyHandler(options: ConfigProxyOptions<any>): ProxyHandler<any> {
  return {
    get(target, property) {
      if (typeof property === 'symbol') {
        return target[property];
      }

      const value = target[property];
      const parentKey = options.parentKey
        ? `${options.parentKey}.${property as any}`
        : String(property);

      return value && typeof value === 'object'
        ? new Proxy(value, createProxyHandler({ ...options, parentKey }))
        : value;
    },
    set(target: any, property, value) {
      options.onSet(target, property as any, value, options.parentKey);
      target[property] = value;
      return true;
    },
    deleteProperty(target, property) {
      options.onDelete(target, property as any, options.parentKey);
      delete target[property];
      return true;
    },
  };
}
