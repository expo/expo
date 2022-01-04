import { TextProps } from '../primitives/Text';
import { ViewProps } from '../primitives/View';
export declare type QuoteProps = React.PropsWithChildren<TextProps & {
    cite?: string;
}>;
export declare type BlockQuoteProps = React.PropsWithChildren<ViewProps & {
    cite?: string;
}>;
export declare type TimeProps = React.PropsWithChildren<TextProps & {
    dateTime?: string;
}>;
export declare type LinkProps = React.PropsWithChildren<TextProps & {
    /** @platform web */
    href?: string;
    /** @platform web */
    target?: string;
}>;
//# sourceMappingURL=Text.types.d.ts.map