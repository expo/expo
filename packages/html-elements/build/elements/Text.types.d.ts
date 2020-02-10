import { TextProps } from '../primitives/Text';
import { ViewProps } from '../primitives/View';
export declare type QuoteProps = React.PropsWithChildren<TextProps & {
    cite?: string;
}>;
export declare type BlockQuoteProps = React.PropsWithChildren<ViewProps & {
    cite?: string;
}>;
