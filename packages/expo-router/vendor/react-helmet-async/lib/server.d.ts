import type { MappedServerState } from './types';
declare const mapStateOnServer: (props: MappedServerState) => {
    priority: {
        toComponent: () => void;
        toString: () => string;
    };
    base: {
        toComponent: () => {};
        toString: () => string;
    };
    bodyAttributes: {
        toComponent: () => {};
        toString: () => string;
    };
    htmlAttributes: {
        toComponent: () => {};
        toString: () => string;
    };
    link: {
        toComponent: () => {};
        toString: () => string;
    };
    meta: {
        toComponent: () => {};
        toString: () => string;
    };
    noscript: {
        toComponent: () => {};
        toString: () => string;
    };
    script: {
        toComponent: () => {};
        toString: () => string;
    };
    style: {
        toComponent: () => {};
        toString: () => string;
    };
    title: {
        toComponent: () => {};
        toString: () => string;
    };
};
export default mapStateOnServer;
