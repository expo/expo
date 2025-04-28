// See: https://github.com/necolas/react-native-web/blob/0.20.0/packages/react-native-web/src/exports/createElement/index.js
declare module 'react-native-web/dist/exports/createElement' {
  export { createElement as default } from 'react';
}

// See: https://github.com/necolas/react-native-web/blob/0.20.0/packages/react-native-web/src/exports/StyleSheet/index.js
declare module 'react-native-web/dist/exports/StyleSheet' {
  type StyleProps = [string, { [key: string]: any } | null];
  type Options = {
    shadow?: boolean;
    textShadow?: boolean;
    writingDirection: 'ltr' | 'rtl';
  };

  export type IStyleSheet = {
    (styles: readonly any[], options?: Options): StyleProps;
    absoluteFill: object;
    absoluteFillObject: object;
    create: typeof create;
    compose: typeof compose;
    flatten: typeof flatten;
    getSheet: typeof getSheet;
    hairlineWidth: number;
  };

  const stylesheet: IStyleSheet;
  export default stylesheet;
}

// See: https://github.com/necolas/react-native-web/blob/0.20.0/packages/react-native-web/src/exports/Text/TextAncestorContext.js
declare module 'react-native-web/dist/exports/Text/TextAncestorContext' {
  import type { Context } from 'react';
  const textAncestorContext: Context<boolean>;
  export default textAncestorContext;
}

// See: https://github.com/necolas/react-native-web/blob/0.20.0/packages/react-native-web/src/exports/View/index.js
declare module 'react-native-web/dist/exports/View' {
  export type { ViewProps } from 'react-native-web/dist/exports/View/types';
}

// See: https://github.com/necolas/react-native-web/blob/0.20.0/packages/react-native-web/src/exports/View/types.js
declare module 'react-native-web/dist/exports/View/types' {
  import type { ColorValue, GenericStyleProp, LayoutEvent } from 'react-native-web/dist/types';

  import type {
    AnimationStyles,
    BorderStyles,
    InteractionStyles,
    LayoutStyles,
    ShadowStyles,
    TransformStyles,
  } from 'react-native-web/dist/types/styles';

  type NumberOrString = number | string;
  type OverscrollBehaviorValue = 'auto' | 'contain' | 'none';
  type idRef = string;
  type idRefList = idRef | idRef[];

  export type AccessibilityProps = {
    'aria-activedescendant'?: idRef | null;
    'aria-atomic'?: boolean | null;
    'aria-autocomplete'?: 'none' | 'list' | 'inline' | 'both' | null;
    'aria-busy'?: boolean | null;
    'aria-checked'?: boolean | 'mixed' | null;
    'aria-colcount'?: number | null;
    'aria-colindex'?: number | null;
    'aria-colspan'?: number | null;
    'aria-controls'?: idRef | null;
    'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time' | null;
    'aria-describedby'?: idRef | null;
    'aria-details'?: idRef | null;
    'aria-disabled'?: boolean | null;
    'aria-errormessage'?: idRef | null;
    'aria-expanded'?: boolean | null;
    'aria-flowto'?: idRef | null;
    'aria-haspopup'?: 'dialog' | 'grid' | 'listbox' | 'menu' | 'tree' | false | null;
    'aria-hidden'?: boolean | null;
    'aria-invalid'?: boolean | null;
    'aria-keyshortcuts'?: string[] | null;
    'aria-label'?: string | null;
    'aria-labelledby'?: idRef | null;
    'aria-level'?: number | null;
    'aria-live'?: 'assertive' | 'none' | 'polite' | null;
    'aria-modal'?: boolean | null;
    'aria-multiline'?: boolean | null;
    'aria-multiselectable'?: boolean | null;
    'aria-orientation'?: 'horizontal' | 'vertical' | null;
    'aria-owns'?: idRef | null;
    'aria-placeholder'?: string | null;
    'aria-posinset'?: number | null;
    'aria-pressed'?: (boolean | 'mixed') | null;
    'aria-readonly'?: boolean | null;
    'aria-required'?: boolean | null;
    'aria-roledescription'?: string | null;
    'aria-rowcount'?: number | null;
    'aria-rowindex'?: number | null;
    'aria-rowspan'?: number | null;
    'aria-selected'?: boolean | null;
    'aria-setsize'?: number | null;
    'aria-sort'?: 'ascending' | 'descending' | 'none' | 'other' | null;
    'aria-valuemax'?: number | null;
    'aria-valuemin'?: number | null;
    'aria-valuenow'?: number | null;
    'aria-valuetext'?: string | null;
    role?: string | null;

    // @deprecated
    accessibilityActiveDescendant?: idRef | null;
    accessibilityAtomic?: boolean | null;
    accessibilityAutoComplete?: ('none' | 'list' | 'inline' | 'both') | null;
    accessibilityBusy?: boolean | null;
    accessibilityChecked?: boolean | 'mixed' | null;
    accessibilityColumnCount?: number | null;
    accessibilityColumnIndex?: number | null;
    accessibilityColumnSpan?: number | null;
    accessibilityControls?: idRefList | null;
    accessibilityCurrent?: boolean | 'page' | 'step' | 'location' | 'date' | 'time' | null;
    accessibilityDescribedBy?: idRefList | null;
    accessibilityDetails?: idRef | null;
    accessibilityDisabled?: boolean | null;
    accessibilityErrorMessage?: idRef | null;
    accessibilityExpanded?: boolean | null;
    accessibilityFlowTo?: idRefList | null;
    accessibilityHasPopup?: 'dialog' | 'grid' | 'listbox' | 'menu' | 'tree' | false | null;
    accessibilityHidden?: boolean | null;
    accessibilityInvalid?: boolean | null;
    accessibilityKeyShortcuts?: string[] | null;
    accessibilityLabel?: string | null;
    accessibilityLabelledBy?: idRefList | null;
    accessibilityLevel?: number | null;
    accessibilityLiveRegion?: 'assertive' | 'none' | 'polite' | null;
    accessibilityModal?: boolean | null;
    accessibilityMultiline?: boolean | null;
    accessibilityMultiSelectable?: boolean | null;
    accessibilityOrientation?: 'horizontal' | 'vertical' | null;
    accessibilityOwns?: idRefList | null;
    accessibilityPlaceholder?: string | null;
    accessibilityPosInSet?: number | null;
    accessibilityPressed?: (boolean | 'mixed') | null;
    accessibilityReadOnly?: boolean | null;
    accessibilityRequired?: boolean | null;
    accessibilityRole?: string | null;
    accessibilityRoleDescription?: string | null;
    accessibilityRowCount?: number | null;
    accessibilityRowIndex?: number | null;
    accessibilityRowSpan?: number | null;
    accessibilitySelected?: boolean | null;
    accessibilitySetSize?: number | null;
    accessibilitySort?: 'ascending' | 'descending' | 'none' | 'other' | null;
    accessibilityValueMax?: number | null;
    accessibilityValueMin?: number | null;
    accessibilityValueNow?: number | null;
    accessibilityValueText?: string | null;
  };

  export type EventProps = {
    onAuxClick?: (e: any) => void;
    onBlur?: (e: any) => void;
    onClick?: (e: any) => void;
    onContextMenu?: (e: any) => void;
    onFocus?: (e: any) => void;
    onGotPointerCapture?: (e: any) => void;
    onKeyDown?: (e: any) => void;
    onKeyUp?: (e: any) => void;
    onLayout?: (e: LayoutEvent) => void;
    onLostPointerCapture?: (e: any) => void;
    onMoveShouldSetResponder?: (e: any) => boolean;
    onMoveShouldSetResponderCapture?: (e: any) => boolean;
    onPointerCancel?: (e: any) => void;
    onPointerDown?: (e: any) => void;
    onPointerEnter?: (e: any) => void;
    onPointerMove?: (e: any) => void;
    onPointerLeave?: (e: any) => void;
    onPointerOut?: (e: any) => void;
    onPointerOver?: (e: any) => void;
    onPointerUp?: (e: any) => void;
    onResponderEnd?: (e: any) => void;
    onResponderGrant?: (e: any) => void | boolean;
    onResponderMove?: (e: any) => void;
    onResponderReject?: (e: any) => void;
    onResponderRelease?: (e: any) => void;
    onResponderStart?: (e: any) => void;
    onResponderTerminate?: (e: any) => void;
    onResponderTerminationRequest?: (e: any) => boolean;
    onScrollShouldSetResponder?: (e: any) => boolean;
    onScrollShouldSetResponderCapture?: (e: any) => boolean;
    onSelectionChangeShouldSetResponder?: (e: any) => boolean;
    onSelectionChangeShouldSetResponderCapture?: (e: any) => boolean;
    onStartShouldSetResponder?: (e: any) => boolean;
    onStartShouldSetResponderCapture?: (e: any) => boolean;
    // unstable
    onMouseDown?: (e: any) => void;
    onMouseEnter?: (e: any) => void;
    onMouseLeave?: (e: any) => void;
    onMouseMove?: (e: any) => void;
    onMouseOver?: (e: any) => void;
    onMouseOut?: (e: any) => void;
    onMouseUp?: (e: any) => void;
    onScroll?: (e: any) => void;
    onTouchCancel?: (e: any) => void;
    onTouchCancelCapture?: (e: any) => void;
    onTouchEnd?: (e: any) => void;
    onTouchEndCapture?: (e: any) => void;
    onTouchMove?: (e: any) => void;
    onTouchMoveCapture?: (e: any) => void;
    onTouchStart?: (e: any) => void;
    onTouchStartCapture?: (e: any) => void;
    onWheel?: (e: any) => void;
  };

  export type ViewStyle = AnimationStyles &
    BorderStyles &
    InteractionStyles &
    LayoutStyles &
    ShadowStyles &
    TransformStyles & {
      backdropFilter?: string | null;
      backgroundAttachment?: string | null;
      backgroundBlendMode?: string | null;
      backgroundClip?: string | null;
      backgroundColor?: ColorValue | null;
      backgroundImage?: string | null;
      backgroundOrigin?: 'border-box' | 'content-box' | 'padding-box';
      backgroundPosition?: string | null;
      backgroundRepeat?: string | null;
      backgroundSize?: string | null;
      boxShadow?: string | null;
      clip?: string | null;
      filter?: string | null;
      opacity?: number | null;
      outlineColor?: ColorValue | null;
      outlineOffset?: NumberOrString | null;
      outlineStyle?: string | null;
      outlineWidth?: NumberOrString | null;
      overscrollBehavior?: OverscrollBehaviorValue | null;
      overscrollBehaviorX?: OverscrollBehaviorValue | null;
      overscrollBehaviorY?: OverscrollBehaviorValue | null;
      pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
      scrollbarWidth?: 'auto' | 'none' | 'thin';
      scrollSnapAlign?: string | null;
      scrollSnapType?: string | null;
      WebkitMaskImage?: string | null;
      WebkitOverflowScrolling?: 'auto' | 'touch';
    };

  export type ViewProps = AccessibilityProps &
    EventProps & {
      children?: any | null;
      dataSet?: object;
      dir?: 'ltr' | 'rtl';
      id?: string | null;
      lang?: string;
      style?: GenericStyleProp<ViewStyle>;
      tabIndex?: 0 | -1 | null;
      testID?: string | null;
      // unstable
      href?: string | null;
      hrefAttrs?: { download?: boolean | null; rel?: string | null; target?: string | null } | null;
      // @deprecated
      focusable?: boolean | null;
      pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
      nativeID?: string | null;
    };
}

// See: https://github.com/necolas/react-native-web/blob/0.20.0/packages/react-native-web/src/modules/forwardedProps/index.js
declare module 'react-native-web/dist/modules/forwardedProps' {
  export const defaultProps = {
    children: true,
    dataSet: true,
    dir: true,
    id: true,
    ref: true,
    suppressHydrationWarning: true,
    tabIndex: true,
    testID: true,
    // @deprecated
    focusable: true,
    nativeID: true,
  };

  export const accessibilityProps = {
    'aria-activedescendant': true,
    'aria-atomic': true,
    'aria-autocomplete': true,
    'aria-busy': true,
    'aria-checked': true,
    'aria-colcount': true,
    'aria-colindex': true,
    'aria-colspan': true,
    'aria-controls': true,
    'aria-current': true,
    'aria-describedby': true,
    'aria-details': true,
    'aria-disabled': true,
    'aria-errormessage': true,
    'aria-expanded': true,
    'aria-flowto': true,
    'aria-haspopup': true,
    'aria-hidden': true,
    'aria-invalid': true,
    'aria-keyshortcuts': true,
    'aria-label': true,
    'aria-labelledby': true,
    'aria-level': true,
    'aria-live': true,
    'aria-modal': true,
    'aria-multiline': true,
    'aria-multiselectable': true,
    'aria-orientation': true,
    'aria-owns': true,
    'aria-placeholder': true,
    'aria-posinset': true,
    'aria-pressed': true,
    'aria-readonly': true,
    'aria-required': true,
    role: true,
    'aria-roledescription': true,
    'aria-rowcount': true,
    'aria-rowindex': true,
    'aria-rowspan': true,
    'aria-selected': true,
    'aria-setsize': true,
    'aria-sort': true,
    'aria-valuemax': true,
    'aria-valuemin': true,
    'aria-valuenow': true,
    'aria-valuetext': true,
    // @deprecated
    accessibilityActiveDescendant: true,
    accessibilityAtomic: true,
    accessibilityAutoComplete: true,
    accessibilityBusy: true,
    accessibilityChecked: true,
    accessibilityColumnCount: true,
    accessibilityColumnIndex: true,
    accessibilityColumnSpan: true,
    accessibilityControls: true,
    accessibilityCurrent: true,
    accessibilityDescribedBy: true,
    accessibilityDetails: true,
    accessibilityDisabled: true,
    accessibilityErrorMessage: true,
    accessibilityExpanded: true,
    accessibilityFlowTo: true,
    accessibilityHasPopup: true,
    accessibilityHidden: true,
    accessibilityInvalid: true,
    accessibilityKeyShortcuts: true,
    accessibilityLabel: true,
    accessibilityLabelledBy: true,
    accessibilityLevel: true,
    accessibilityLiveRegion: true,
    accessibilityModal: true,
    accessibilityMultiline: true,
    accessibilityMultiSelectable: true,
    accessibilityOrientation: true,
    accessibilityOwns: true,
    accessibilityPlaceholder: true,
    accessibilityPosInSet: true,
    accessibilityPressed: true,
    accessibilityReadOnly: true,
    accessibilityRequired: true,
    accessibilityRole: true,
    accessibilityRoleDescription: true,
    accessibilityRowCount: true,
    accessibilityRowIndex: true,
    accessibilityRowSpan: true,
    accessibilitySelected: true,
    accessibilitySetSize: true,
    accessibilitySort: true,
    accessibilityValueMax: true,
    accessibilityValueMin: true,
    accessibilityValueNow: true,
    accessibilityValueText: true,
  };

  export const clickProps = {
    onClick: true,
    onAuxClick: true,
    onContextMenu: true,
    onGotPointerCapture: true,
    onLostPointerCapture: true,
    onPointerCancel: true,
    onPointerDown: true,
    onPointerEnter: true,
    onPointerMove: true,
    onPointerLeave: true,
    onPointerOut: true,
    onPointerOver: true,
    onPointerUp: true,
  };

  export const focusProps = {
    onBlur: true,
    onFocus: true,
  };

  export const keyboardProps = {
    onKeyDown: true,
    onKeyDownCapture: true,
    onKeyUp: true,
    onKeyUpCapture: true,
  };

  export const mouseProps = {
    onMouseDown: true,
    onMouseEnter: true,
    onMouseLeave: true,
    onMouseMove: true,
    onMouseOver: true,
    onMouseOut: true,
    onMouseUp: true,
  };

  export const touchProps = {
    onTouchCancel: true,
    onTouchCancelCapture: true,
    onTouchEnd: true,
    onTouchEndCapture: true,
    onTouchMove: true,
    onTouchMoveCapture: true,
    onTouchStart: true,
    onTouchStartCapture: true,
  };

  export const styleProps = {
    style: true,
  };
}

// See: https://github.com/necolas/react-native-web/blob/0.20.0/packages/react-native-web/src/modules/mergeRefs/index.js
declare module 'react-native-web/dist/modules/mergeRefs' {
  export default function mergeRefs(
    ...args: readonly React.ElementRef<any>[]
  ): (node: HTMLElement | null) => void;
}

// See: https://github.com/necolas/react-native-web/blob/0.20.0/packages/react-native-web/src/modules/pick/index.js
declare module 'react-native-web/dist/modules/pick' {
  export default function pick<T extends Record<string, any>, L extends Record<string, boolean>>(
    obj: T,
    list: L
  ): { [K in Extract<keyof T, keyof L> as L[K] extends true ? K : never]: T[K] };
}

// See: https://github.com/necolas/react-native-web/blob/0.20.0/packages/react-native-web/src/modules/useElementLayout/index.js
declare module 'react-native-web/dist/modules/useElementLayout' {
  import type { LayoutEvent } from 'react-native-web/dist/types';

  export default function useElementLayout(
    ref: ElementRef<any>,
    onLayout?: ?((e: LayoutEvent) => void)
  ): void;
}

// See: https://github.com/necolas/react-native-web/blob/0.20.0/packages/react-native-web/src/modules/useLocale/index.js
declare module 'react-native-web/dist/modules/useLocale' {
  import type { PropsWithChildren } from 'react';

  type Locale = string;
  type WritingDirection = 'ltr' | 'rtl';
  type LocaleValue = {
    /** Locale writing direction. */
    direction: WritingDirection;
    /** Locale BCP47 language code: https://www.ietf.org/rfc/bcp/bcp47.txt */
    locale?: Locale;
  };

  export function getLocaleDirection(locale: Locale): WritingDirection;
  export function LocaleProvider(props: PropsWithChildren<ProviderProps>): Node;
  export function useLocaleContext(): LocaleValue;
}

// See: https://github.com/necolas/react-native-web/blob/0.20.0/packages/react-native-web/src/modules/useMergeRefs/index.js
declare module 'react-native-web/dist/modules/useMergeRefs' {
  export { default } from 'react-native-web/dist/modules/mergeRefs';
}

// See: https://github.com/necolas/react-native-web/blob/0.20.0/packages/react-native-web/src/modules/usePlatformMethods/index.js
declare module 'react-native-web/dist/modules/usePlatformMethods' {
  import type { GenericStyleProp } from 'react-native-web/dist/types';
  import type { ViewProps } from 'react-native-web/dist/exports/View/types';

  /**
   * Adds non-standard methods to the hode element. This is temporarily until an
   * API like `ReactNative.measure(hostRef, callback)` is added to React Native.
   */
  export default function usePlatformMethods(methods: {
    style?: GenericStyleProp<any>;
    pointerEvents?: ViewProps['pointerEvents'];
  });
}

// See: https://github.com/necolas/react-native-web/blob/0.20.0/packages/react-native-web/src/modules/useResponderEvents/index.js
declare module 'react-native-web/dist/modules/useResponderEvents' {
  import type { ResponderConfig } from 'react-native-web/dist/modules/useResponderEvents/ResponderSystem';

  export default function useResponderEvents(hostRef: any, config?: ResponderConfig): void;
}

// See: https://github.com/necolas/react-native-web/blob/0.20.0/packages/react-native-web/src/modules/useResponderEvents/createResponderEvent.js
declare module 'react-native-web/dist/modules/useResponderEvents/createResponderEvent' {
  import type { TouchHistory } from 'react-native-web/src/modules/useResponderEvents/ResponderTouchHistoryStore';
  import type { TouchEvent } from 'react-native-web/src/modules/useResponderEvents/ResponderEventTypes';

  export type ResponderEvent = {
    bubbles: boolean;
    cancelable: boolean;
    currentTarget: any;
    defaultPrevented: boolean | null;
    dispatchConfig: {
      registrationName?: string;
      phasedRegistrationNames?: {
        bubbled: string;
        captured: string;
      };
    };
    eventPhase: number | null;
    isDefaultPrevented: () => boolean;
    isPropagationStopped: () => boolean;
    isTrusted: boolean | null;
    preventDefault: () => void;
    stopPropagation: () => void;
    nativeEvent: TouchEvent;
    persist: () => void;
    target: any | null;
    timeStamp: number;
    touchHistory: TouchHistory;
  };
}

// See: https://github.com/necolas/react-native-web/blob/0.20.0/packages/react-native-web/src/modules/useResponderEvents/ResponderEventTypes.js
declare module 'react-native-web/src/modules/useResponderEvents/ResponderEventTypes' {
  export type Touch = {
    force: number;
    identifier: number;
    // The locationX and locationY properties are non-standard additions
    locationX: any;
    locationY: any;
    pageX: number;
    pageY: number;
    target: any;
    // Touches in a list have a timestamp property
    timestamp: number;
  };

  export type TouchEvent = {
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
    // TouchList is an array in the Responder system
    changedTouches: Touch[];
    force: number;
    // React Native adds properties to the "nativeEvent that are usually only found on W3C Touches ‾\_(ツ)_/‾
    identifier: number;
    locationX: any;
    locationY: any;
    pageX: number;
    pageY: number;
    target: any;
    // The timestamp has a lowercase "s" in the Responder system
    timestamp: number;
    // TouchList is an array in the Responder system
    touches: Touch[];
  };
}

// See: https://github.com/necolas/react-native-web/blob/0.20.0/packages/react-native-web/src/modules/useResponderEvents/ResponderSystem.js
declare module 'react-native-web/dist/modules/useResponderEvents/ResponderSystem' {
  import type { ResponderEvent } from 'react-native-web/dist/modules/useResponderEvents/createResponderEvent';

  export type ResponderConfig = {
    // Direct responder events dispatched directly to responder. Do not bubble.
    onResponderEnd?: (e: ResponderEvent) => void | null;
    onResponderGrant?: (e: ResponderEvent) => void | boolean | null;
    onResponderMove?: (e: ResponderEvent) => void | null;
    onResponderRelease?: (e: ResponderEvent) => void | null;
    onResponderReject?: (e: ResponderEvent) => void | null;
    onResponderStart?: (e: ResponderEvent) => void | null;
    onResponderTerminate?: (e: ResponderEvent) => void | null;
    onResponderTerminationRequest?: (e: ResponderEvent) => boolean | null;
    // On pointer down, should this element become the responder?
    onStartShouldSetResponder?: (e: ResponderEvent) => boolean | null;
    onStartShouldSetResponderCapture?: (e: ResponderEvent) => boolean | null;
    // On pointer move, should this element become the responder?
    onMoveShouldSetResponder?: (e: ResponderEvent) => boolean | null;
    onMoveShouldSetResponderCapture?: (e: ResponderEvent) => boolean | null;
    // On scroll, should this element become the responder? Do no bubble
    onScrollShouldSetResponder?: (e: ResponderEvent) => boolean | null;
    onScrollShouldSetResponderCapture?: (e: ResponderEvent) => boolean | null;
    // On text selection change, should this element become the responder?
    onSelectionChangeShouldSetResponder?: (e: ResponderEvent) => boolean | null;
    onSelectionChangeShouldSetResponderCapture?: (e: ResponderEvent) => booleam | null;
  };
}

// See: https://github.com/necolas/react-native-web/blob/0.20.0/packages/react-native-web/src/modules/useResponderEvents/ResponderTouchHistoryStore.js
declare module 'react-native-web/src/modules/useResponderEvents/ResponderTouchHistoryStore' {
  type TouchRecord = {
    currentPageX: number;
    currentPageY: number;
    currentTimeStamp: number;
    previousPageX: number;
    previousPageY: number;
    previousTimeStamp: number;
    startPageX: number;
    startPageY: number;
    startTimeStamp: number;
    touchActive: boolean;
  };

  export type TouchHistory = Readonly<{
    indexOfSingleActiveTouch: number;
    mostRecentTimeStamp: number;
    numberActiveTouches: number;
    touchBank: TouchRecord[];
  }>;
}

// See: https://github.com/necolas/react-native-web/blob/0.20.0/packages/react-native-web/src/types/index.js
declare module 'react-native-web/dist/types' {
  export type ColorValue = null | string;

  export type DimensionValue = null | number | string;

  export type EdgeInsetsValue = {
    top: number;
    left: number;
    right: number;
    bottom: number;
  };

  export type GenericStyleProp<T> =
    | null
    | void
    | $ReadOnly<T>
    | false
    | ''
    | $ReadOnlyArray<GenericStyleProp<T>>;

  export type LayoutValue = {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  export type LayoutEvent = {
    nativeEvent: {
      layout: LayoutValue;
      target: any;
    };
    timeStamp: number;
  };

  export type PointValue = {
    x: number;
    y: number;
  };

  type LayoutCallback = (
    x: number,
    y: number,
    width: number,
    height: number,
    left: number,
    top: number
  ) => void;

  type MeasureInWindowCallback = (left: number, top: number, width: number, height: number) => void;

  // Mixin to HTMLElement that represents additions from the `usePlatformMethods` hook
  export interface PlatformMethods {
    blur: () => void;
    focus: () => void;
    measure: (callback: LayoutCallback) => void;
    measureInWindow: (callback: MeasureInWindowCallback) => void;
    measureLayout: (
      relativeToNativeNode: object,
      onSuccess: LayoutCallback,
      onFail: () => void
    ) => void;
  }
}

// See: https://github.com/necolas/react-native-web/blob/0.20.0/packages/react-native-web/src/types/styles.js
declare module 'react-native-web/dist/types/styles' {
  import type { ColorValue, DimensionValue } from 'react-native-web/dist/types';

  type NumberOrString = number | string;

  /**
   * Animations and transitions
   */

  type AnimationDirection = 'alternate' | 'alternate-reverse' | 'normal' | 'reverse';
  type AnimationFillMode = 'none' | 'forwards' | 'backwards' | 'both';
  type AnimationIterationCount = number | 'infinite';
  type AnimationKeyframes = string | object;
  type AnimationPlayState = 'paused' | 'running';

  export type AnimationStyles = {
    animationDelay?: string | string[] | null;
    animationDirection?: AnimationDirection | AnimationDirection[] | null;
    animationDuration?: string | string[] | null;
    animationFillMode?: AnimationFillMode | AnimationFillMode[] | null;
    animationIterationCount?: AnimationIterationCount | AnimationIterationCount[] | null;
    animationKeyframes?: AnimationKeyframes | AnimationKeyframes[] | null;
    animationPlayState?: AnimationPlayState | AnimationPlayState[] | null;
    animationTimingFunction?: string | string[] | null;
    transitionDelay?: string | string[] | null;
    transitionDuration?: string | string[] | null;
    transitionProperty?: string | string[] | null;
    transitionTimingFunction?: string | string[] | null;
  };

  /**
   * Border
   */

  type BorderRadiusValue = number | string;
  type BorderStyleValue = 'solid' | 'dotted' | 'dashed';

  export type BorderStyles = {
    // color
    borderColor?: ColorValue | null;
    borderBlockColor?: ColorValue | null;
    borderBlockEndColor?: ColorValue | null;
    borderBlockStartColor?: ColorValue | null;
    borderBottomColor?: ColorValue | null;
    borderInlineColor?: ColorValue | null;
    borderInlineEndColor?: ColorValue | null;
    borderInlineStartColor?: ColorValue | null;
    borderLeftColor?: ColorValue | null;
    borderRightColor?: ColorValue | null;
    borderTopColor?: ColorValue | null;
    // radius
    borderRadius?: BorderRadiusValue | null;
    borderEndEndRadius?: BorderRadiusValue | null;
    borderEndStartRadius?: BorderRadiusValue | null;
    borderStartEndRadius?: BorderRadiusValue | null;
    borderStartStartRadius?: BorderRadiusValue | null;
    borderBottomLeftRadius?: BorderRadiusValue | null;
    borderBottomRightRadius?: BorderRadiusValue | null;
    borderTopLeftRadius?: BorderRadiusValue | null;
    borderTopRightRadius?: BorderRadiusValue | null;
    // style
    borderStyle?: BorderStyleValue | null;
    borderBlockStyle?: BorderStyleValue | null;
    borderBlockEndStyle?: BorderStyleValue | null;
    borderBlockStartStyle?: BorderStyleValue | null;
    borderBottomStyle?: BorderStyleValue | null;
    borderInlineStyle?: BorderStyleValue | null;
    borderInlineEndStyle?: BorderStyleValue | null;
    borderInlineStartStyle?: BorderStyleValue | null;
    borderLeftStyle?: BorderStyleValue | null;
    borderRightStyle?: BorderStyleValue | null;
    borderTopStyle?: BorderStyleValue | null;
    // deprecated
    borderEndColor?: ColorValue | null;
    borderStartColor?: ColorValue | null;
    borderEndStyle?: BorderStyleValue | null;
    borderStartStyle?: BorderStyleValue | null;
    borderBottomEndRadius?: BorderRadiusValue | null;
    borderBottomStartRadius?: BorderRadiusValue | null;
    borderTopEndRadius?: BorderRadiusValue | null;
    borderTopStartRadius?: BorderRadiusValue | null;
  };

  /**
   * Interactions
   */

  type CursorValue =
    | 'alias'
    | 'all-scroll'
    | 'auto'
    | 'cell'
    | 'context-menu'
    | 'copy'
    | 'crosshair'
    | 'default'
    | 'grab'
    | 'grabbing'
    | 'help'
    | 'pointer'
    | 'progress'
    | 'wait'
    | 'text'
    | 'vertical-text'
    | 'move'
    | 'none'
    | 'no-drop'
    | 'not-allowed'
    | 'zoom-in'
    | 'zoom-out'
    // resize
    | 'col-resize'
    | 'e-resize'
    | 'ew-resize'
    | 'n-resize'
    | 'ne-resize'
    | 'ns-resize'
    | 'nw-resize'
    | 'row-resize'
    | 's-resize'
    | 'se-resize'
    | 'sw-resize'
    | 'w-resize'
    | 'nesw-resize'
    | 'nwse-resize';

  type TouchActionValue =
    | 'auto'
    | 'inherit'
    | 'manipulation'
    | 'none'
    | 'pan-down'
    | 'pan-left'
    | 'pan-right'
    | 'pan-up'
    | 'pan-x'
    | 'pan-y'
    | 'pinch-zoom';

  type UserSelect = 'all' | 'auto' | 'contain' | 'none' | 'text';

  export type InteractionStyles = {
    // https://developer.mozilla.org/en-US/docs/Web/CSS/cursor#Formal_syntax
    cursor?: CursorValue | null;
    // https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action#Formal_syntax
    touchAction?: TouchActionValue | null;
    // https://developer.mozilla.org/en-US/docs/Web/CSS/user-select#Formal_syntax_2
    userSelect?: UserSelect | null;
    willChange?: string | null;
  };

  /**
   * Layout
   */

  type OverflowValue = 'auto' | 'hidden' | 'scroll' | 'visible';
  type VisiblilityValue = 'hidden' | 'visible';

  export type LayoutStyles = {
    alignContent?:
      | 'center'
      | 'flex-end'
      | 'flex-start'
      | 'space-around'
      | 'space-between'
      | 'stretch';
    alignItems?: 'baseline' | 'center' | 'flex-end' | 'flex-start' | 'stretch' | null;
    alignSelf?: 'auto' | 'baseline' | 'center' | 'flex-end' | 'flex-start' | 'stretch' | null;
    aspectRatio?: NumberOrString | null;
    backfaceVisibility?: VisiblilityValue | null;
    borderWidth?: DimensionValue | null;
    borderBlockWidth?: DimensionValue | null;
    borderBlockEndWidth?: DimensionValue | null;
    borderBlockStartWidth?: DimensionValue | null;
    borderBottomWidth?: DimensionValue | null;
    borderInlineWidth?: DimensionValue | null;
    borderInlineEndWidth?: DimensionValue | null;
    borderInlineStartWidth?: DimensionValue | null;
    borderLeftWidth?: DimensionValue | null;
    borderRightWidth?: DimensionValue | null;
    borderTopWidth?: DimensionValue | null;
    bottom?: DimensionValue | null;
    boxSizing?: ('border-box' | 'content-box' | 'padding-box') | null;
    columnGap?: DimensionValue | null;
    direction?: ('inherit' | 'ltr' | 'rtl') | null;
    display?: string | null;
    flex?: number | null;
    flexBasis?: DimensionValue | null;
    flexDirection?: ('column' | 'column-reverse' | 'row' | 'row-reverse') | null;
    flexGrow?: number | null;
    flexShrink?: number | null;
    flexWrap?: ('nowrap' | 'wrap' | 'wrap-reverse') | null;
    gap?: DimensionValue | null;
    height?: DimensionValue | null;
    inset?: DimensionValue | null;
    insetBlock?: DimensionValue | null;
    insetBlockEnd?: DimensionValue | null;
    insetBlockStart?: DimensionValue | null;
    insetInline?: DimensionValue | null;
    insetInlineEnd?: DimensionValue | null;
    insetInlineStart?: DimensionValue | null;
    justifyContent?:
      | 'center'
      | 'flex-end'
      | 'flex-start'
      | 'space-around'
      | 'space-between'
      | 'space-evenly'
      | null;
    left?: DimensionValue | null;
    margin?: DimensionValue | null;
    marginBlock?: DimensionValue | null;
    marginBlockEnd?: DimensionValue | null;
    marginBlockStart?: DimensionValue | null;
    marginBottom?: DimensionValue | null;
    marginInline?: DimensionValue | null;
    marginInlineEnd?: DimensionValue | null;
    marginInlineStart?: DimensionValue | null;
    marginLeft?: DimensionValue | null;
    marginRight?: DimensionValue | null;
    marginTop?: DimensionValue | null;
    maxHeight?: DimensionValue | null;
    maxWidth?: DimensionValue | null;
    minHeight?: DimensionValue | null;
    minWidth?: DimensionValue | null;
    order?: number | null;
    overflow?: OverflowValue | null;
    overflowX?: OverflowValue | null;
    overflowY?: OverflowValue | null;
    padding?: DimensionValue | null;
    paddingBlock?: DimensionValue | null;
    paddingBlockEnd?: DimensionValue | null;
    paddingBlockStart?: DimensionValue | null;
    paddingBottom?: DimensionValue | null;
    paddingInline?: DimensionValue | null;
    paddingInlineEnd?: DimensionValue | null;
    paddingInlineStart?: DimensionValue | null;
    paddingLeft?: DimensionValue | null;
    paddingRight?: DimensionValue | null;
    paddingTop?: DimensionValue | null;
    position?: 'absolute' | 'fixed' | 'relative' | 'static' | 'sticky' | null;
    right?: DimensionValue | null;
    rowGap?: DimensionValue | null;
    top?: DimensionValue | null;
    visibility?: VisiblilityValue | null;
    width?: DimensionValue | null;
    zIndex?: number | null;
    /**
     * @platform web
     */
    gridAutoColumns?: string | null;
    gridAutoFlow?: string | null;
    gridAutoRows?: string | null;
    gridColumnEnd?: string | null;
    gridColumnGap?: string | null;
    gridColumnStart?: string | null;
    gridRowEnd?: string | null;
    gridRowGap?: string | null;
    gridRowStart?: string | null;
    gridTemplateColumns?: string | null;
    gridTemplateRows?: string | null;
    gridTemplateAreas?: string | null;
    /**
     * @deprecated
     */
    borderEndWidth?: DimensionValue | null;
    borderStartWidth?: DimensionValue | null;
    end?: DimensionValue | null;
    marginHorizontal?: DimensionValue | null;
    marginEnd?: DimensionValue | null;
    marginStart?: DimensionValue | null;
    marginVertical?: DimensionValue | null;
    paddingHorizontal?: DimensionValue | null;
    paddingStart?: DimensionValue | null;
    paddingEnd?: DimensionValue | null;
    paddingVertical?: DimensionValue | null;
    start?: DimensionValue | null;
  };

  /**
   * Shadows
   */

  export type ShadowStyles = {
    // @deprecated
    shadowColor?: ColorValue | null;
    shadowOffset?: {
      width?: DimensionValue;
      height?: DimensionValue;
    } | null;
    shadowOpacity?: number | null;
    shadowRadius?: DimensionValue | null;
  };

  /**
   * Transforms
   */

  export type TransformStyles = {
    perspective?: NumberOrString | null;
    perspectiveOrigin?: string | null;
    transform?:
      | string
      | null
      | (
          | { perspective: NumberOrString }
          | { rotate: string }
          | { rotateX: string }
          | { rotateY: string }
          | { rotateZ: string }
          | { scale: number }
          | { scaleX: number }
          | { scaleY: number }
          | { scaleZ: number }
          | { scale3d: string }
          | { skewX: string }
          | { skewY: string }
          | { translateX: NumberOrString }
          | { translateY: NumberOrString }
          | { translateZ: NumberOrString }
          | { translate3d: string }
        )[];
    transformOrigin?: ?(string | NumberOrString[]);
    transformStyle?: ?('flat' | 'preserve-3d');
  };
}
