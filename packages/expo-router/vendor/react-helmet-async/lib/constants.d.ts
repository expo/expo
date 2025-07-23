export declare enum TAG_PROPERTIES {
    CHARSET = "charset",
    CSS_TEXT = "cssText",
    HREF = "href",
    HTTPEQUIV = "http-equiv",
    INNER_HTML = "innerHTML",
    ITEM_PROP = "itemprop",
    NAME = "name",
    PROPERTY = "property",
    REL = "rel",
    SRC = "src"
}
export declare enum ATTRIBUTE_NAMES {
    BODY = "bodyAttributes",
    HTML = "htmlAttributes",
    TITLE = "titleAttributes"
}
export declare enum TAG_NAMES {
    BASE = "base",
    BODY = "body",
    HEAD = "head",
    HTML = "html",
    LINK = "link",
    META = "meta",
    NOSCRIPT = "noscript",
    SCRIPT = "script",
    STYLE = "style",
    TITLE = "title",
    FRAGMENT = "Symbol(react.fragment)"
}
export declare const SEO_PRIORITY_TAGS: {
    link: {
        rel: string[];
    };
    script: {
        type: string[];
    };
    meta: {
        charset: string;
        name: string[];
        property: string[];
    };
};
export declare const VALID_TAG_NAMES: TAG_NAMES[];
export declare const REACT_TAG_MAP: {
    accesskey: string;
    charset: string;
    class: string;
    contenteditable: string;
    contextmenu: string;
    'http-equiv': string;
    itemprop: string;
    tabindex: string;
};
export declare const HTML_TAG_MAP: {
    [key: string]: string;
};
export declare const HELMET_ATTRIBUTE = "data-rh";
