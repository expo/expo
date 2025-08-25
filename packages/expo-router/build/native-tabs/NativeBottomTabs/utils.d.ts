import type { JSXElementConstructor, ReactNode } from 'react';
import React from 'react';
import type { ExtendedNativeTabOptions, TypeOrRecord } from './types';
export declare function filterAllowedChildrenElements<Components extends JSXElementConstructor<any>[]>(children: ReactNode | ReactNode[], components: Components): React.ReactElement<React.ComponentProps<Components[number]>, Components[number]>[];
export declare function isChildOfType<T extends JSXElementConstructor<any>>(child: ReactNode, type: T): child is React.ReactElement<React.ComponentProps<T>, T>;
export declare function shouldTabBeVisible(options: ExtendedNativeTabOptions): boolean;
export declare function getValueFromTypeOrRecord<T, K extends string>(value: TypeOrRecord<T, K> | undefined, key: K): T | undefined;
//# sourceMappingURL=utils.d.ts.map