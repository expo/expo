import type { PropsWithChildren, ReactElement, ReactNode } from 'react';
import React, { Component } from 'react';
import type { HelmetProps } from './types';
export * from './types';
export { default as HelmetData } from './HelmetData';
export { default as HelmetProvider } from './Provider';
type Props = {
    [key: string]: any;
};
export declare class Helmet extends Component<PropsWithChildren<HelmetProps>> {
    static defaultProps: {
        defer: boolean;
        encodeSpecialCharacters: boolean;
        prioritizeSeoTags: boolean;
    };
    shouldComponentUpdate(nextProps: HelmetProps): boolean;
    mapNestedChildrenToProps(child: ReactElement, nestedChildren: ReactNode): {
        innerHTML: string | number | true | ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<ReactNode> | React.ReactPortal;
        cssText?: undefined;
    } | {
        cssText: string | number | true | ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<ReactNode> | React.ReactPortal;
        innerHTML?: undefined;
    };
    flattenArrayTypeChildren(child: JSX.Element, arrayTypeChildren: {
        [key: string]: JSX.Element[];
    }, newChildProps: Props, nestedChildren: ReactNode): {};
    mapObjectTypeChildren(child: JSX.Element, newProps: Props, newChildProps: Props, nestedChildren: ReactNode): {};
    mapArrayTypeChildrenToProps(arrayTypeChildren: {
        [key: string]: JSX.Element;
    }, newProps: Props): {
        [x: string]: any;
    };
    warnOnInvalidChildren(child: JSX.Element, nestedChildren: ReactNode): boolean;
    mapChildrenToProps(children: ReactNode, newProps: Props): {
        [x: string]: any;
    };
    render(): React.JSX.Element;
}
