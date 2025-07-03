/**
 * Prints a link for given URL, using text if provided, otherwise text is just the URL.
 * Format links as dim (unless disabled) and with an underline.
 *
 * @example https://expo.dev
 */
export declare function link(url: string, { text, dim }?: {
    text?: string;
    dim?: boolean;
}): string;
