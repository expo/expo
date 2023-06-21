import { spacing } from '@expo/styleguide-native';
type SpacingKey = `${keyof typeof spacing}`;
type DescriptiveScale = 'micro' | 'tiny' | 'small' | 'medium' | 'large' | 'xl';
type ScaleKey = SpacingKey | DescriptiveScale;
type Scale = Record<ScaleKey, number>;
export declare const scale: Scale;
export declare const padding: {
    padding: Record<"0" | "1" | "2" | "3" | "4" | "0.5" | "1.5" | "2.5" | "3.5" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12" | "14" | "16" | "20" | "24" | "28" | "32" | "36" | "40" | "44" | "48" | "52" | "56" | "60" | "64" | "72" | "80" | "96" | DescriptiveScale, any>;
    px: Record<"0" | "1" | "2" | "3" | "4" | "0.5" | "1.5" | "2.5" | "3.5" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12" | "14" | "16" | "20" | "24" | "28" | "32" | "36" | "40" | "44" | "48" | "52" | "56" | "60" | "64" | "72" | "80" | "96" | DescriptiveScale, any>;
    py: Record<"0" | "1" | "2" | "3" | "4" | "0.5" | "1.5" | "2.5" | "3.5" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12" | "14" | "16" | "20" | "24" | "28" | "32" | "36" | "40" | "44" | "48" | "52" | "56" | "60" | "64" | "72" | "80" | "96" | DescriptiveScale, any>;
    pb: Record<"0" | "1" | "2" | "3" | "4" | "0.5" | "1.5" | "2.5" | "3.5" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12" | "14" | "16" | "20" | "24" | "28" | "32" | "36" | "40" | "44" | "48" | "52" | "56" | "60" | "64" | "72" | "80" | "96" | DescriptiveScale, any>;
    pt: Record<"0" | "1" | "2" | "3" | "4" | "0.5" | "1.5" | "2.5" | "3.5" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12" | "14" | "16" | "20" | "24" | "28" | "32" | "36" | "40" | "44" | "48" | "52" | "56" | "60" | "64" | "72" | "80" | "96" | DescriptiveScale, any>;
};
export declare const margin: {
    margin: Record<"0" | "1" | "2" | "3" | "4" | "0.5" | "1.5" | "2.5" | "3.5" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12" | "14" | "16" | "20" | "24" | "28" | "32" | "36" | "40" | "44" | "48" | "52" | "56" | "60" | "64" | "72" | "80" | "96" | DescriptiveScale, any>;
    mx: Record<"0" | "1" | "2" | "3" | "4" | "0.5" | "1.5" | "2.5" | "3.5" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12" | "14" | "16" | "20" | "24" | "28" | "32" | "36" | "40" | "44" | "48" | "52" | "56" | "60" | "64" | "72" | "80" | "96" | DescriptiveScale, any>;
    my: Record<"0" | "1" | "2" | "3" | "4" | "0.5" | "1.5" | "2.5" | "3.5" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12" | "14" | "16" | "20" | "24" | "28" | "32" | "36" | "40" | "44" | "48" | "52" | "56" | "60" | "64" | "72" | "80" | "96" | DescriptiveScale, any>;
    mb: Record<"0" | "1" | "2" | "3" | "4" | "0.5" | "1.5" | "2.5" | "3.5" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12" | "14" | "16" | "20" | "24" | "28" | "32" | "36" | "40" | "44" | "48" | "52" | "56" | "60" | "64" | "72" | "80" | "96" | DescriptiveScale, any>;
    mt: Record<"0" | "1" | "2" | "3" | "4" | "0.5" | "1.5" | "2.5" | "3.5" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12" | "14" | "16" | "20" | "24" | "28" | "32" | "36" | "40" | "44" | "48" | "52" | "56" | "60" | "64" | "72" | "80" | "96" | DescriptiveScale, any>;
};
export declare const width: Record<"0" | "1" | "2" | "3" | "4" | "0.5" | "1.5" | "2.5" | "3.5" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12" | "14" | "16" | "20" | "24" | "28" | "32" | "36" | "40" | "44" | "48" | "52" | "56" | "60" | "64" | "72" | "80" | "96" | DescriptiveScale, any>;
export declare const height: Record<"0" | "1" | "2" | "3" | "4" | "0.5" | "1.5" | "2.5" | "3.5" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12" | "14" | "16" | "20" | "24" | "28" | "32" | "36" | "40" | "44" | "48" | "52" | "56" | "60" | "64" | "72" | "80" | "96" | DescriptiveScale, any>;
export declare const rounded: {
    rounded: {
        none: {
            borderRadius: number;
        };
        small: {
            borderRadius: number;
        };
        medium: {
            borderRadius: number;
        };
        large: {
            borderRadius: number;
        };
        full: {
            borderRadius: number;
        };
    };
    roundedTop: {
        none: {
            borderTopLeftRadius: number;
            borderTopRightRadius: number;
        };
        small: {
            borderTopLeftRadius: number;
            borderTopRightRadius: number;
        };
        medium: {
            borderTopLeftRadius: number;
            borderTopRightRadius: number;
        };
        large: {
            borderTopLeftRadius: number;
            borderTopRightRadius: number;
        };
        full: {
            borderTopLeftRadius: number;
            borderTopRightRadius: number;
        };
    };
    roundedBottom: {
        none: {
            borderBottomLeftRadius: number;
            borderBottomRightRadius: number;
        };
        small: {
            borderBottomLeftRadius: number;
            borderBottomRightRadius: number;
        };
        medium: {
            borderBottomLeftRadius: number;
            borderBottomRightRadius: number;
        };
        large: {
            borderBottomLeftRadius: number;
            borderBottomRightRadius: number;
        };
        full: {
            borderBottomLeftRadius: number;
            borderBottomRightRadius: number;
        };
    };
};
export declare const text: {
    align: {
        center: {
            textAlign: "center" | "auto" | "left" | "right" | "justify" | undefined;
        };
    };
    size: {
        small: {
            fontSize: number;
            lineHeight: number;
        };
        medium: {
            fontSize: number;
            lineHeight: number;
            letterSpacing: number;
        };
        large: {
            fontSize: number;
            lineHeight: number;
            letterSpacing: number;
        };
    };
    leading: {
        large: {
            lineHeight: number;
        };
    };
    type: {
        mono: {
            fontFamily: string;
        };
        InterBlack: {
            fontFamily: string;
        };
        InterBlackItalic: {
            fontFamily: string;
        };
        InterBold: {
            fontFamily: string;
        };
        InterBoldItalic: {
            fontFamily: string;
        };
        InterExtraBold: {
            fontFamily: string;
        };
        InterExtraBoldItalic: {
            fontFamily: string;
        };
        InterExtraLight: {
            fontFamily: string;
        };
        InterExtraLightItalic: {
            fontFamily: string;
        };
        InterRegular: {
            fontFamily: string;
        };
        InterItalic: {
            fontFamily: string;
        };
        InterLight: {
            fontFamily: string;
        };
        InterLightItalic: {
            fontFamily: string;
        };
        InterMedium: {
            fontFamily: string;
        };
        InterMediumItalic: {
            fontFamily: string;
        };
        InterSemiBold: {
            fontFamily: string;
        };
        InterSemiBoldItalic: {
            fontFamily: string;
        };
        InterThin: {
            fontFamily: string;
        };
        InterThinItalic: {
            fontFamily: string;
        };
    };
    weight: {
        thin: {
            fontFamily: string;
        };
        extralight: {
            fontFamily: string;
        };
        light: {
            fontFamily: string;
        };
        normal: {
            fontFamily: string;
        };
        medium: {
            fontFamily: string;
        };
        semibold: {
            fontFamily: string;
        };
        bold: {
            fontFamily: string;
        };
        extrabold: {
            fontFamily: string;
        };
        black: {
            fontFamily: string;
        };
    };
    color: {
        default: {
            color: string;
        };
        error: {
            color: string;
        };
        warning: {
            color: string;
        };
        success: {
            color: string;
        };
        secondary: {
            color: string;
        };
        primary: {
            color: string;
        };
        link: {
            color: string;
        };
    };
};
export declare const textDark: {
    base: {
        color: string;
    };
    color: {
        default: {
            color: string;
        };
        error: {
            color: string;
        };
        warning: {
            color: string;
        };
        success: {
            color: string;
        };
        secondary: {
            color: string;
        };
        primary: {
            color: string;
        };
        link: {
            color: string;
        };
    };
};
export declare const bg: {
    none: {
        backgroundColor: string;
    };
    default: {
        backgroundColor: string;
    };
    secondary: {
        backgroundColor: string;
    };
    overlay: {
        backgroundColor: string;
    };
    success: {
        backgroundColor: string;
    };
    warning: {
        backgroundColor: string;
    };
    error: {
        backgroundColor: string;
    };
};
export declare const bgDark: {
    default: {
        backgroundColor: string;
    };
    secondary: {
        backgroundColor: string;
    };
    overlay: {
        backgroundColor: string;
    };
    success: {
        backgroundColor: string;
    };
    warning: {
        backgroundColor: string;
    };
    error: {
        backgroundColor: string;
    };
};
type NavigationTheme = {
    dark: boolean;
    colors: {
        primary: string;
        background: string;
        card: string;
        text: string;
        border: string;
        notification: string;
    };
};
export declare const lightNavigationTheme: NavigationTheme;
export declare const darkNavigationTheme: NavigationTheme;
export declare const border: {
    default: {
        borderColor: string;
        borderWidth: number;
    };
    warning: {
        borderColor: string;
        borderWidth: number;
    };
    hairline: {
        borderColor: string;
        borderWidth: number;
    };
};
export declare const borderDark: {
    default: {
        borderColor: string;
        borderWidth: number;
    };
    warning: {
        borderColor: string;
        borderWidth: number;
    };
    error: {
        borderColor: string;
        borderWidth: number;
    };
    hairline: {
        borderColor: string;
        borderWidth: number;
    };
};
export {};
//# sourceMappingURL=theme.d.ts.map