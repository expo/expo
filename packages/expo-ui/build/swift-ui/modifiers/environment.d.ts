/**
 * Environment keys for the environment modifier.
 */
export declare const EnvironmentKey: {
    readonly editMode: "editMode";
    readonly colorScheme: "colorScheme";
};
/**
 * Edit mode values for the environment modifier.
 */
export declare const EditMode: {
    readonly active: "active";
    readonly inactive: "inactive";
    readonly transient: "transient";
};
/**
 * Color scheme values for the environment modifier.
 */
export declare const ColorScheme: {
    readonly light: "light";
    readonly dark: "dark";
};
type EnvironmentKeyType = (typeof EnvironmentKey)[keyof typeof EnvironmentKey];
type EditModeType = (typeof EditMode)[keyof typeof EditMode];
type ColorSchemeType = (typeof ColorScheme)[keyof typeof ColorScheme];
/**
 * Sets a SwiftUI environment value.
 * @param key - The environment key (use EnvironmentKey constants).
 * @param value - The value to set (use EditMode or ColorScheme constants).
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/environment(_:_:)).
 */
export declare const environment: (key: EnvironmentKeyType, value: EditModeType | ColorSchemeType) => import("./createModifier").ModifierConfig;
export {};
//# sourceMappingURL=environment.d.ts.map