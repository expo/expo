import { Fragment } from './react-stub';

export type ReactElementNode = {
  type: unknown;
  key: string | null;
  props: Record<string, any>;
};

function ReactElement(
  type: unknown,
  key: string | null,
  props: Record<string, any>
): ReactElementNode {
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

function jsxProd(
  type: unknown,
  config: any,
  maybeKey?: string | number | bigint
): ReactElementNode {
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
  Fragment,
  Fragment as _Fragment,
  jsxFileName as _jsxFileName,
  jsxProd,
  jsxProd as jsx,
  jsxProd as jsxs,
  jsxProd as jsxDEV,
  jsxProd as _jsx,
  jsxProd as _jsxs,
  jsxProd as _jsxDEV,
};
