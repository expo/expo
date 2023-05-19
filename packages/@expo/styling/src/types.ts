import type {
  MediaQuery,
  Animation,
  ContainerType,
  MediaCondition,
  Time,
  EasingFunction,
} from 'lightningcss';
import type {
  ImageStyle,
  MatrixTransform,
  PerpectiveTransform,
  RotateTransform,
  RotateXTransform,
  RotateYTransform,
  RotateZTransform,
  ScaleTransform,
  ScaleXTransform,
  ScaleYTransform,
  SkewXTransform,
  SkewYTransform,
  TextStyle,
  TranslateXTransform,
  TranslateYTransform,
  ViewStyle,
} from 'react-native';

export type RuntimeValue = {
  type: 'runtime';
  name: string;
  arguments: any[];
};

export type ExtractedStyleValue = string | number | RuntimeValue | ExtractedStyleValue[];

export type ExtractedStyle = {
  isDynamic?: boolean;
  media?: MediaQuery[];
  variables?: Record<string, ExtractedStyleValue>;
  style: Record<string, ExtractedStyleValue>;
  pseudoClasses?: PseudoClassesQuery;
  animations?: ExtractedAnimations;
  container?: Partial<ExtractedContainer>;
  containerQuery?: ExtractedContainerQuery[];
  transition?: ExtractedTransition;
  requiresLayout?: boolean;
};

export type InteropMeta = {
  /* The processed styled props */
  styledProps: Record<string, Style>;
  /* The processed styled props */
  styledPropsMeta: Record<string, PropInteropMeta>;
  /* Inline variables */
  variables: Record<string, unknown>;
  /* Inline container runtime info */
  containers: Record<string, ContainerRuntime>;
  /* A list of props that will be processed by useAnimated  */
  animatedProps: Set<string>;
  /* A list of props that will be processed by useTransition  */
  transitionProps: Set<string>;
  /* Does this component need the onLayout handler  */
  requiresLayout: boolean;
  /* Does variables have any values  */
  hasInlineVariables: boolean;
  /* Does variables have any values  */
  hasInlineContainers: boolean;
  /* If defined, we should wrap in the AnimationInterop */
  animationInteropKey?: string;
  /* Should we add press handlers */
  hasActive?: boolean;
  /* Should we add hover handlers */
  hasHover?: boolean;
  /* Should we add focus handlers */
  hasFocus?: boolean;
};

export type PropInteropMeta = {
  variables?: Record<string, unknown>;
  containers?: string[];
  animated: boolean;
  transition: boolean;
  requiresLayout: boolean;
  hasActive?: boolean;
  hasHover?: boolean;
  hasFocus?: boolean;
};

export type StyleMeta = {
  variableProps?: Set<string>;
  media?: MediaQuery[];
  variables?: Record<string, unknown>;
  pseudoClasses?: PseudoClassesQuery;
  animations?: ExtractedAnimations;
  container?: ExtractedContainer;
  containerQuery?: ExtractedContainerQuery[];
  transition?: ExtractedTransition;
  requiresLayout?: boolean;
};

export interface SignalLike<T = unknown> {
  get(): T;
}

export interface Signal<T = unknown> {
  get(): T;
  snapshot(): T;
  set(value: T): void;
  stale(change: 1 | -1, fresh: boolean): void;
  subscribe(callback: () => void): () => void;
}

export type Interaction = {
  active: Signal<boolean>;
  hover: Signal<boolean>;
  focus: Signal<boolean>;
  layout: {
    width: Signal<number>;
    height: Signal<number>;
  };
};

export type ExtractedContainer = {
  names?: string[];
  type: ContainerType;
};

export type ContainerRuntime = {
  type: ContainerType;
  interaction: Interaction;
  style: Style;
};

export type ExtractedContainerQuery = {
  name?: string | null;
  condition?: MediaCondition;
  pseudoClasses?: PseudoClassesQuery;
};

export type ExtractedAnimations = {
  [K in keyof Animation]?: Animation[K][];
};

export type ExtractedTransition = {
  /**
   * The delay before the transition starts.
   */
  delay?: Time[];
  /**
   * The duration of the transition.
   */
  duration?: Time[];
  /**
   * The property to transition.
   */
  property?: AnimatableCSSProperty[];
  /**
   * The easing function for the transition.
   */
  timingFunction?: EasingFunction[];
};

export type ExtractedAnimation = {
  frames: ExtractedKeyframe[];
  requiresLayout?: boolean;
};

export type ExtractedKeyframe = {
  selector: number;
  style: Record<string, ExtractedStyleValue>;
};

export type PseudoClassesQuery = {
  hover?: boolean;
  active?: boolean;
  focus?: boolean;
};

export type StyleSheetRegisterOptions = {
  declarations?: Record<string, ExtractedStyle | ExtractedStyle[]>;
  keyframes?: Record<string, ExtractedAnimation>;
};

export type Style = ViewStyle & TextStyle & ImageStyle;
export type StyleProp = Style | StyleProp[] | undefined;

export type NamedStyles<T> = {
  [P in keyof T]: StyleProp;
};

export type TransformRecord = Partial<
  PerpectiveTransform &
    RotateTransform &
    RotateXTransform &
    RotateYTransform &
    RotateZTransform &
    ScaleTransform &
    ScaleXTransform &
    ScaleYTransform &
    TranslateXTransform &
    TranslateYTransform &
    SkewXTransform &
    SkewYTransform &
    MatrixTransform
>;

export type CamelToKebabCase<
  T extends string,
  A extends string = ''
> = T extends `${infer F}${infer R}`
  ? CamelToKebabCase<R, `${A}${F extends Lowercase<F> ? '' : '-'}${Lowercase<F>}`>
  : A;

export type KebabToCamelCase<S extends string> = S extends `${infer P1}-${infer P2}${infer P3}`
  ? `${Lowercase<P1>}${Uppercase<P2>}${KebabToCamelCase<P3>}`
  : Lowercase<S>;

/*
 * This is a list of all the CSS properties that can be animated
 * Source: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animated_properties
 */
export type AnimatableCSSProperty = keyof Style &
  KebabToCamelCase<
    | 'background-color'
    | 'border-bottom-color'
    | 'border-bottom-left-radius'
    | 'border-bottom-right-radius'
    | 'border-bottom-width'
    | 'border-color'
    | 'border-left-color'
    | 'border-left-width'
    | 'border-radius'
    | 'border-right-color'
    | 'border-right-width'
    | 'border-top-color'
    | 'border-top-width'
    | 'border-width'
    | 'bottom'
    | 'color'
    | 'flex'
    | 'flex-basis'
    | 'flex-grow'
    | 'flex-shrink'
    | 'font-size'
    | 'font-weight'
    | 'gap'
    | 'height'
    | 'left'
    | 'letter-spacing'
    | 'line-height'
    | 'margin'
    | 'margin-bottom'
    | 'margin-left'
    | 'margin-right'
    | 'margin-top'
    | 'max-height'
    | 'max-width'
    | 'min-height'
    | 'min-width'
    | 'object-position'
    | 'opacity'
    | 'order'
    | 'padding'
    | 'padding-bottom'
    | 'padding-left'
    | 'padding-right'
    | 'padding-top'
    | 'right'
    | 'rotate'
    | 'scale'
    | 'text-decoration'
    | 'top'
    | 'transform'
    | 'transform-origin'
    | 'translate'
    | 'vertical-align'
    | 'visibility'
    | 'width'
    | 'word-spacing'
    | 'z-index'
  >;
