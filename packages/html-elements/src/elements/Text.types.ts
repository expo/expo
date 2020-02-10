import { TextProps } from '../primitives/Text';
import { ViewProps } from '../primitives/View';

export type QuoteProps = React.PropsWithChildren<TextProps & { cite?: string }>;

export type BlockQuoteProps = React.PropsWithChildren<ViewProps & { cite?: string }>;
