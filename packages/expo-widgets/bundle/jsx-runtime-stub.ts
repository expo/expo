import { Fragment } from './react-stub';

export type ReactElementNode = {
  type: unknown;
  key: string | null;
  props: Record<string, any>;
  __expoWidgetIdentity?: string;
};

function jsxProd(
  type: unknown,
  config: any,
  maybeKey?: string | number | bigint
): ReactElementNode {
  const { key = maybeKey, ...props } = config;
  return { type, key: key === undefined ? null : String(key), props };
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
