import { Dimensions, StyleSheet as RNStyleSheet, Appearance } from "react-native";
import { StyleSheetRegisterOptions, ExtractedStyle, StyleProp } from "../../types";
export declare const StyleSheet: typeof RNStyleSheet & {
    rem: {
        get: () => number;
        set: (nextValue: number) => void;
        reset: () => void;
    };
    __subscribe(subscription: () => void): () => void;
    __reset({ dimensions, appearance }?: {
        dimensions?: Dimensions | undefined;
        appearance?: typeof Appearance | undefined;
    }): void;
    register: (options: StyleSheetRegisterOptions) => void;
    create: (styles: Record<string, ExtractedStyle>) => Record<string, StyleProp>;
};
//# sourceMappingURL=stylesheet.d.ts.map