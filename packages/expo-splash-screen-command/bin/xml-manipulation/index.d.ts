import { Element } from 'xml-js';
declare type ExplicitNewValue<T> = {
    newValue: T;
};
declare type WithExplicitNewValue<T> = T | ExplicitNewValue<T>;
declare type ExpectedElementAttributes = Record<string, WithExplicitNewValue<string | number | undefined>>;
declare type WithExplicitIndex<T> = T & {
    idx?: number;
};
declare type ExpectedElements = WithExplicitNewValue<WithExplicitIndex<ExpectedElement>[]>;
export declare type ExpectedElementType = {
    name: string;
    attributes?: ExpectedElementAttributes;
    elements?: ExpectedElements;
};
export declare type ExpectedElementsType = {
    elements: ExpectedElements;
};
export declare type ExpectedCommentType = {
    comment: string;
};
export declare type ExpectedTextType = {
    text: string | number | boolean;
};
export declare type ExpectedElement = ExpectedElementType | ExpectedElementsType | ExpectedCommentType | ExpectedTextType;
/**
 * Assumption is that elements are `equal` semantically
 */
export declare function mergeXmlElements(current: Element, expected: ExpectedElement): Element;
export declare function readXmlFile(filePath: string, fallbackContent?: string): Promise<Element>;
export declare function writeXmlFile(filePath: string, xml: Element): Promise<void>;
export {};
