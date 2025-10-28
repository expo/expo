import { type CommonViewModifierProps } from '../types';
export type ShareLinkProps = {
    /**
     * The URL or item to be shared.
     * This can be a web URL, a file path, or any other shareable item.
     */
    item?: string;
    /**
     * A function that returns a promise resolving to the URL to be shared.
     * When provided, the `ShareLink` will wait for this promise to resolve before sharing.
     * > *Note*: `preview` prop is required when using `getItemAsync`.
     */
    getItemAsync?: () => Promise<string>;
    /**
     * Optional subject for the share action.
     * This is typically used as the title of the shared content.
     */
    subject?: string;
    /**
     * Optional message for the share action.
     * This is typically used as a description or additional information about the shared content.
     */
    message?: string;
    /**
     * Optional preview for the share action.
     * This can include a title and an image to be displayed in the share dialog.
     */
    preview?: {
        title: string;
        image: string;
    };
    /**
     * Optional children to be rendered inside the share link.
     */
    children?: React.ReactNode;
} & CommonViewModifierProps;
/**
 * Renders the native ShareLink component with the provided properties.
 *
 * @param {ShareLinkProps} props - The properties passed to the ShareLink component.
 * @returns {JSX.Element} The rendered native ShareLink component.
 * @platform ios 16.0+
 */
export declare function ShareLink(props: ShareLinkProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map