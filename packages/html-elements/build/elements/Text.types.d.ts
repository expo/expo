import { TextProps } from '../primitives/Text';
import { ViewProps } from '../primitives/View';
export type QuoteProps = React.PropsWithChildren<TextProps & {
    cite?: string;
}>;
export type BlockQuoteProps = React.PropsWithChildren<ViewProps & {
    cite?: string;
}>;
export type TimeProps = React.PropsWithChildren<TextProps & {
    dateTime?: string;
}>;
export type LinkProps = React.PropsWithChildren<TextProps & {
    /** @platform web */
    href?: string;
    /** @platform web */
    target?: string;
    /** @platform web */
    rel?: string;
    /** @platform web */
    download?: boolean | string;
}>;
//# sourceMappingURL=Text.types.d.ts.map