interface PropList {
    [key: string]: any;
}
type PropsList = PropList[];
type AttributeList = string[];
interface MatchProps {
    [key: string]: string | AttributeList;
}
declare const reducePropsToState: (propsList: PropsList) => {
    baseTag: any;
    bodyAttributes: any;
    defer: any;
    encode: any;
    htmlAttributes: any;
    linkTags: any;
    metaTags: any;
    noscriptTags: any;
    onChangeClientState: any;
    scriptTags: any;
    styleTags: any;
    title: any;
    titleAttributes: any;
    prioritizeSeoTags: boolean;
};
export declare const flattenArray: (possibleArray: string[] | string) => string;
export { reducePropsToState };
export declare const prioritizer: (elementsList: HTMLElement[], propsToMatch: MatchProps) => {
    priority: HTMLElement[];
    default: HTMLElement[];
};
export declare const without: (obj: PropList, key: string) => {
    [x: string]: any;
};
