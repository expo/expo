import * as ReactNative from 'react-native';

declare module 'react-native' {
  export const unstable_createElement: <P>(
    type: React.ElementType,
    props?: P
  ) => React.ReactElement<P>;

  type DisplayValue = ReactNative.FlexStyle['display'] | 'inline-flex';
  type OverflowValue = 'auto' | 'hidden' | 'scroll' | 'visible';
  type WebDimensionValue = ReactNative.DimensionValue | string;

  type WebRole =
    | ReactNative.Role
    /**
     * Accessibility roles mapped to components
     * @see https://github.com/necolas/react-native-web/blob/0.19.1/packages/react-native-web/src/modules/AccessibilityUtil/propsToAccessibilityComponent.js
     */
    | 'article' // <article />
    | 'banner' // <header />
    | 'blockquote' // <blockquote />
    | 'button' // <button />
    | 'code' // <code />
    | 'complementary' // <aside />
    | 'contentinfo' // <footer />
    | 'deletion' // <del />
    | 'emphasis' // <em />
    | 'figure' // <figure />
    | 'form' // <form />
    | 'heading' // <h{1,6} />
    | 'insertion' // <ins />
    | 'label' // <label />
    | 'list' // <ul />
    | 'listitem' // <li />
    | 'main' // <main />
    | 'navigation' // <nav />
    | 'paragraph' // <p />
    | 'region' // <section />
    | 'strong'; // <strong />

  interface WebAccessibilityProps {
    /**
     * Additional accessibility props
     */
    tabIndex?: 0 | -1;

    /**
     * Aria props (additional, minus existants)
     * @see https://necolas.github.io/react-native-web/docs/accessibility
     * @see https://reactnative.dev/docs/accessibility#aria-valuemax
     */
    'aria-activedescendant'?: string;
    'aria-atomic'?: boolean;
    'aria-autocomplete'?: string;
    'aria-colcount'?: number;
    'aria-colindex'?: number;
    'aria-colspan'?: number;
    'aria-controls'?: string;
    'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
    'aria-describedby'?: string;
    'aria-details'?: string;
    'aria-errormessage'?: string;
    'aria-flowto'?: string;
    'aria-haspopup'?: string;
    'aria-invalid'?: boolean;
    'aria-keyshortcuts'?: string;
    'aria-level'?: number;
    'aria-multiline'?: boolean;
    'aria-multiselectable'?: boolean;
    'aria-orientation'?: 'horizontal' | 'vertical';
    'aria-owns'?: string;
    'aria-placeholder'?: string;
    'aria-posinset'?: number;
    'aria-pressed'?: boolean;
    'aria-readonly'?: boolean;
    'aria-required'?: boolean;
    'aria-roledescription'?: string;
    'aria-rowcount'?: number;
    'aria-rowindex'?: number;
    'aria-rowspan'?: number;
    'aria-setsize'?: number;
    'aria-sort'?: 'ascending' | 'descending' | 'none' | 'other';
  }

  export interface PressableStateCallbackType {
    readonly focused: boolean;
    readonly hovered: boolean;
    readonly pressed: boolean;
  }

  export interface ImageProps extends WebAccessibilityProps {
    role?: WebRole;
  }

  export interface TextProps extends WebAccessibilityProps {
    role?: WebRole;
  }

  export interface ViewProps extends WebAccessibilityProps {
    dataSet?: Record<string, string | undefined>;
    dir?: string;
    role?: WebRole;
  }

  /**
   * Animations and transitions
   */

  type AnimationDirection = 'alternate' | 'alternate-reverse' | 'normal' | 'reverse';
  type AnimationFillMode = 'none' | 'forwards' | 'backwards' | 'both';
  type AnimationIterationCount = number | 'infinite';
  type AnimationKeyframes = Record<string, ImageStyle | TextStyle | ViewStyle>;
  type AnimationPlayState = 'paused' | 'running';

  export interface AnimationStyles {
    animationDelay?: string;
    animationDirection?: AnimationDirection;
    animationDuration?: string;
    animationFillMode?: AnimationFillMode;
    animationIterationCount?: AnimationIterationCount;
    animationKeyframes?: AnimationKeyframes | AnimationKeyframes[];
    animationPlayState?: AnimationPlayState;
    animationTimingFunction?: string;
    transitionDelay?: string;
    transitionDuration?: string;
    transitionProperty?: string;
    transitionTimingFunction?: string;
  }

  export interface ImageStyle extends AnimationStyles {
    display?: DisplayValue;
    height?: WebDimensionValue;
    width?: WebDimensionValue;
    overflowX?: OverflowValue;
    overflowY?: OverflowValue;
    paddingLeft?: WebDimensionValue;
    paddingRight?: WebDimensionValue;
    paddingTop?: WebDimensionValue;
    paddingBottom?: WebDimensionValue;
    [key: `--${string}`]: string;
  }

  export interface TextStyle extends AnimationStyles {
    display?: DisplayValue;
    height?: WebDimensionValue;
    width?: WebDimensionValue;
    overflowX?: OverflowValue;
    overflowY?: OverflowValue;
    paddingLeft?: WebDimensionValue;
    paddingRight?: WebDimensionValue;
    paddingTop?: WebDimensionValue;
    paddingBottom?: WebDimensionValue;
    whiteSpace?: 'normal' | 'nowrap' | 'pre' | 'pre-line' | 'pre-wrap';
    [key: `--${string}`]: string;
  }

  export interface ViewStyle extends AnimationStyles {
    appearance?: 'none' | 'auto';
    display?: DisplayValue;
    height?: WebDimensionValue;
    width?: WebDimensionValue;
    overflowX?: OverflowValue;
    overflowY?: OverflowValue;
    paddingLeft?: WebDimensionValue;
    paddingRight?: WebDimensionValue;
    paddingTop?: WebDimensionValue;
    paddingBottom?: WebDimensionValue;
    [key: `--${string}`]: string;
  }
}
