import type { HeaderOptions, Layout } from '../types';
type Props = HeaderOptions & {
    /**
     * Options for the back button.
     */
    back?: {
        /**
         * Title of the previous screen.
         */
        title: string | undefined;
        /**
         * The `href` to use for the anchor tag on web
         */
        href: string | undefined;
    };
    /**
     * Whether the header is in a modal
     */
    modal?: boolean;
    /**
     * Layout of the screen.
     */
    layout?: Layout;
    /**
     * Title text for the header.
     */
    title: string;
};
export declare function Header(props: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=Header.d.ts.map