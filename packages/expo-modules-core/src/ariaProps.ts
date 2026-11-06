// The mapping of the `aria-*`, `id` and `tabIndex` props that the views of Expo Modules v1 and v2 share:
// the class wrapper of `requireNativeViewManager` and the components of `createNativeViewComponent`.

/**
 * Maps `aria-*`, `id` and `tabIndex` props to native props.
 * Mirrors `Libraries/Components/View/View.js` in React Native 0.88.
 */
export function mapAriaProps(props: Record<string, any>): Record<string, any> {
  const {
    accessibilityState,
    accessibilityValue,
    'aria-busy': ariaBusy,
    'aria-checked': ariaChecked,
    'aria-disabled': ariaDisabled,
    'aria-expanded': ariaExpanded,
    'aria-hidden': ariaHidden,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-live': ariaLive,
    'aria-selected': ariaSelected,
    'aria-valuemax': ariaValueMax,
    'aria-valuemin': ariaValueMin,
    'aria-valuenow': ariaValueNow,
    'aria-valuetext': ariaValueText,
    id,
    tabIndex,
    ...resolvedProps
  } = props;

  if (ariaLabelledBy !== undefined) {
    resolvedProps.accessibilityLabelledBy = ariaLabelledBy.split(/\s*,\s*/g);
  }
  if (ariaLabel !== undefined) {
    resolvedProps.accessibilityLabel = ariaLabel;
  }
  if (ariaLive !== undefined) {
    resolvedProps.accessibilityLiveRegion = ariaLive === 'off' ? 'none' : ariaLive;
  }
  if (ariaHidden !== undefined) {
    resolvedProps.accessibilityElementsHidden = ariaHidden;
    if (ariaHidden === true) {
      resolvedProps.importantForAccessibility = 'no-hide-descendants';
    }
  }
  if (id !== undefined) {
    resolvedProps.nativeID = id;
  }
  if (tabIndex !== undefined) {
    resolvedProps.focusable = !tabIndex;
  }
  if (
    accessibilityState != null ||
    ariaBusy != null ||
    ariaChecked != null ||
    ariaDisabled != null ||
    ariaExpanded != null ||
    ariaSelected != null
  ) {
    resolvedProps.accessibilityState = {
      busy: ariaBusy ?? accessibilityState?.busy,
      checked: ariaChecked ?? accessibilityState?.checked,
      disabled: ariaDisabled ?? accessibilityState?.disabled,
      expanded: ariaExpanded ?? accessibilityState?.expanded,
      selected: ariaSelected ?? accessibilityState?.selected,
    };
  }
  if (
    accessibilityValue != null ||
    ariaValueMax != null ||
    ariaValueMin != null ||
    ariaValueNow != null ||
    ariaValueText != null
  ) {
    resolvedProps.accessibilityValue = {
      max: ariaValueMax ?? accessibilityValue?.max,
      min: ariaValueMin ?? accessibilityValue?.min,
      now: ariaValueNow ?? accessibilityValue?.now,
      text: ariaValueText ?? accessibilityValue?.text,
    };
  }
  return resolvedProps;
}

/**
 * The props that `mapAriaProps` maps to native props.
 */
const ARIA_PROP_NAMES = [
  'aria-busy',
  'aria-checked',
  'aria-disabled',
  'aria-expanded',
  'aria-hidden',
  'aria-label',
  'aria-labelledby',
  'aria-live',
  'aria-selected',
  'aria-valuemax',
  'aria-valuemin',
  'aria-valuenow',
  'aria-valuetext',
  'id',
  'tabIndex',
] as const;

/**
 * Whether the props have any prop that `mapAriaProps` maps. Views without them skip the copy
 * that `mapAriaProps` makes.
 */
export function hasAriaProps(props: Record<string, any>): boolean {
  for (const name of ARIA_PROP_NAMES) {
    if (props[name] !== undefined) {
      return true;
    }
  }
  return false;
}
