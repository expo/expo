import type { JSXElementConstructor, ReactNode } from 'react';
import React from 'react';
export declare function filterAllowedChildrenElements<Components extends JSXElementConstructor<any>[]>(children: ReactNode | ReactNode[], components: Components): React.ReactElement<React.ComponentProps<Components[number]>, Components[number]>[];
export declare function isChildOfType<T extends JSXElementConstructor<any>>(child: ReactNode, type: T): child is React.ReactElement<React.ComponentProps<T>, T>;
//# sourceMappingURL=children.d.ts.map