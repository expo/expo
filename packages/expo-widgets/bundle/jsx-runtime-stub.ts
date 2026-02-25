export const REACT_ELEMENT_TYPE: symbol = Symbol.for('react.transitional.element');
export const REACT_FRAGMENT_TYPE: symbol = Symbol.for('react.fragment');

function ReactElement(type: typeof ReactElement, key: string | null, props: Record<string, any>) {
  if (typeof type === 'function') {
    return (type as any)(props);
  }

  const element = {
    type,
    key,
    props,
  };

  return element;
}

function jsxProd(type: typeof ReactElement, config: any, maybeKey?: string | number | bigint) {
  let key = null;
  if (maybeKey !== undefined) {
    key = '' + maybeKey;
  }
  if (hasValidKey(config)) {
    key = '' + config.key;
  }

  let props: Record<string, any>;
  if (!('key' in config)) {
    props = config;
  } else {
    props = {};
    for (const propName in config) {
      if (propName !== 'key') {
        props[propName] = config[propName];
      }
    }
  }

  return ReactElement(type, key, props);
}

function hasValidKey(config: any) {
  return config.key !== undefined;
}

const jsxFileName = 'widget';
export {
  REACT_FRAGMENT_TYPE as Fragment,
  jsxFileName as _jsxFileName,
  jsxProd,
  jsxProd as jsx,
  jsxProd as jsxs,
  jsxProd as jsxDEV,
  jsxProd as _jsx,
  jsxProd as _jsxs,
  jsxProd as _jsxDEV,
};
