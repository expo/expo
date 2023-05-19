import React from 'react';
import ReactJSXRuntime from 'react/jsx-runtime';

import { render } from './render';

export const Fragment = React.Fragment;

export function jsx(type: any, props: any, key: any) {
  return render((ReactJSXRuntime as any).jsx, type, props, key);
}

export function jsxs(type: any, props: any, key: any) {
  return render((ReactJSXRuntime as any).jsxs, type, props, key);
}
