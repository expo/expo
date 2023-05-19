import type { ComponentType } from 'react';
import { View, Text, Pressable } from 'react-native';

import { defaultCSSInterop } from '../web/css-interop';
import { InteropFunction, polyfillMapping } from './mapping';

export { defaultCSSInterop };

export function makeStyled(component: ComponentType, interop: InteropFunction = defaultCSSInterop) {
  polyfillMapping.set(component, interop);
}

makeStyled(View);
makeStyled(Pressable);
makeStyled(Text);

export const svgCSSInterop = defaultCSSInterop;
