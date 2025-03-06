import type { HTMLAttributes, JSX } from 'react';
import type HelmetData from './HelmetData';
export type Attributes = {
    [key: string]: string;
};
interface OtherElementAttributes {
    [key: string]: string | number | boolean | null | undefined;
}
export type HtmlProps = JSX.IntrinsicElements['html'] & OtherElementAttributes;
export type BodyProps = JSX.IntrinsicElements['body'] & OtherElementAttributes;
export type LinkProps = JSX.IntrinsicElements['link'];
export type MetaProps = JSX.IntrinsicElements['meta'] & {
    charset?: string | undefined;
    'http-equiv'?: string | undefined;
    itemprop?: string | undefined;
};
export type TitleProps = HTMLAttributes<HTMLTitleElement>;
export interface HelmetTags {
    baseTag: HTMLBaseElement[];
    linkTags: HTMLLinkElement[];
    metaTags: HTMLMetaElement[];
    noscriptTags: HTMLElement[];
    scriptTags: HTMLScriptElement[];
    styleTags: HTMLStyleElement[];
}
export interface HelmetDatum {
    toString(): string;
    toComponent(): React.Component<any>;
}
export interface HelmetHTMLBodyDatum {
    toString(): string;
    toComponent(): React.HTMLAttributes<HTMLBodyElement>;
}
export interface HelmetHTMLElementDatum {
    toString(): string;
    toComponent(): React.HTMLAttributes<HTMLHtmlElement>;
}
export interface HelmetServerState {
    base: HelmetDatum;
    bodyAttributes: HelmetHTMLBodyDatum;
    htmlAttributes: HelmetHTMLElementDatum;
    link: HelmetDatum;
    meta: HelmetDatum;
    noscript: HelmetDatum;
    script: HelmetDatum;
    style: HelmetDatum;
    title: HelmetDatum;
    titleAttributes: HelmetDatum;
    priority: HelmetDatum;
}
export type MappedServerState = HelmetProps & HelmetTags & {
    encode?: boolean;
};
export interface TagList {
    [key: string]: HTMLElement[];
}
export interface StateUpdate extends HelmetTags {
    bodyAttributes: BodyProps;
    defer: boolean;
    htmlAttributes: HtmlProps;
    onChangeClientState: (newState: StateUpdate, addedTags: TagList, removedTags: TagList) => void;
    title: string;
    titleAttributes: TitleProps;
}
export interface HelmetProps {
    async?: boolean;
    base?: Attributes;
    bodyAttributes?: BodyProps;
    defaultTitle?: string;
    defer?: boolean;
    encodeSpecialCharacters?: boolean;
    helmetData?: HelmetData;
    htmlAttributes?: HtmlProps;
    onChangeClientState?: (newState: StateUpdate, addedTags: HelmetTags, removedTags: HelmetTags) => void;
    link?: LinkProps[];
    meta?: MetaProps[];
    noscript?: Attributes[];
    script?: Attributes[];
    style?: Attributes[];
    title?: string;
    titleAttributes?: Attributes;
    titleTemplate?: string;
    prioritizeSeoTags?: boolean;
}
export {};
