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
/**
 * Provide a consistent "Learn more" link experience.
 * Format links as dim (unless disabled) with an underline.
 *
 * @example [Learn more](https://expo.dev)
 * @example Learn more: https://expo.dev
 */
export declare function learnMore(url: string, { learnMoreMessage: maybeLearnMoreMessage, dim, }?: {
    learnMoreMessage?: string;
    dim?: boolean;
}): string;
