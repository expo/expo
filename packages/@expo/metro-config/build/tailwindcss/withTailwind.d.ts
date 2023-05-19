import type { ConfigT } from 'metro-config';
import type { ExpoJsTransformerConfig } from '../transform-worker/transform-worker';
type TailwindConfigT = ConfigT & {
    transformer: ExpoJsTransformerConfig;
};
export declare function withTailwind(config: TailwindConfigT, cssPathname?: string, { input, output, }?: {
    input?: string | undefined;
    output?: string | undefined;
}): TailwindConfigT;
export {};
