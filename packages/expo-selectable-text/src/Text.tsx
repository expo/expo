import * as React from 'react';
import { useCallback, useContext, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text as RNText,
  processColor,
  unstable_TextAncestorContext as TextAncestorContext,
  type GestureResponderEvent,
  type GestureResponderHandlers,
  type NativeSyntheticEvent,
  type TextProps,
  type TextStyle,
} from 'react-native';
import * as PressabilityDebug from 'react-native/Libraries/Pressability/PressabilityDebug';
import usePressability from 'react-native/Libraries/Pressability/usePressability';
import { NativeVirtualText } from 'react-native/Libraries/Text/TextNativeComponent';

import {
  NativeSelectableText,
  setMenuItems,
  type NativeSelectableTextProps,
  type SelectionMenuActionEvent,
  type SelectionMenuItem,
} from './NativeSelectableText';

export type TextMenuProps = {
  /** `Text.MenuAction` elements, in the order the menu shows them. */
  children?: React.ReactNode;
};

export type TextMenuActionProps = {
  /** The title of the menu item. */
  children: string;
  /** Called with the selection when the user presses the menu item. */
  onPress: (event: SelectionMenuActionEvent) => void;
};

// React Native's `Text` accepts these responder props, which its legacy
// TypeScript `TextProps` leaves out.
type TextResponderProps = Pick<
  GestureResponderHandlers,
  | 'onResponderGrant'
  | 'onResponderMove'
  | 'onResponderRelease'
  | 'onResponderTerminate'
  | 'onResponderTerminationRequest'
  | 'onStartShouldSetResponder'
>;

export type SelectableTextProps = TextProps &
  TextResponderProps & {
    ref?: React.Ref<React.ComponentRef<typeof RNText>>;
  };

/**
 * Adds items to the menu that appears for a text selection. Put it as a direct
 * child of the outermost `Text`. The text must be `selectable`.
 */
function TextMenu(_props: TextMenuProps): null {
  return null;
}

/** An item of `Text.Menu`. */
function TextMenuAction(_props: TextMenuActionProps): null {
  return null;
}

/**
 * React Native's `Text`. With a `Text.Menu` child, the outermost `Text`
 * renders a paragraph that adds the menu items to the selection menu.
 */
function Text(props: SelectableTextProps) {
  const hasTextAncestor = useContext(TextAncestorContext);
  const { menu, children } = splitMenu(props.children);

  if (menu == null || hasTextAncestor) {
    if (__DEV__ && menu != null) {
      console.warn(
        'Text.Menu was ignored because its Text is nested in another Text. The selection menu belongs to the outermost Text. Move Text.Menu to the outermost Text.'
      );
    }
    return <RNText {...props}>{children}</RNText>;
  }
  return (
    <SelectableTextRoot {...props} menu={menu}>
      {children}
    </SelectableTextRoot>
  );
}

Text.displayName = 'Text';
Text.Menu = TextMenu;
Text.MenuAction = TextMenuAction;

export default Text;

function splitMenu(children: React.ReactNode): {
  menu: React.ReactElement<TextMenuProps> | null;
  children: React.ReactNode;
} {
  const list = Array.isArray(children) ? children : [children];
  const menuIndex = list.findIndex(
    (child) => React.isValidElement(child) && child.type === TextMenu
  );
  if (menuIndex === -1) {
    return { menu: null, children };
  }
  const rest = list.filter((_, index) => index !== menuIndex);
  return {
    menu: list[menuIndex] as React.ReactElement<TextMenuProps>,
    children: Array.isArray(children) ? rest : null,
  };
}

function readMenuActions(menu: React.ReactElement<TextMenuProps>) {
  const items: SelectionMenuItem[] = [];
  const handlers = new Map<string, TextMenuActionProps['onPress']>();
  React.Children.forEach(menu.props.children, (child) => {
    if (!React.isValidElement<TextMenuActionProps>(child) || child.type !== TextMenuAction) {
      return;
    }
    const id = String(items.length);
    items.push({ id, title: String(child.props.children) });
    handlers.set(id, child.props.onPress);
  });
  return { items, handlers };
}

/*
 * The root path of React Native's `Text` (`Libraries/Text/Text.js`, 0.88),
 * ported line by line. Only the host component and the menu wiring differ.
 * Keep it in sync with React Native.
 */
function SelectableTextRoot({
  ref: forwardedRef,
  menu,
  accessible,
  accessibilityLabel,
  accessibilityRole,
  accessibilityState,
  allowFontScaling,
  'aria-busy': ariaBusy,
  'aria-checked': ariaChecked,
  'aria-disabled': ariaDisabled,
  'aria-expanded': ariaExpanded,
  'aria-hidden': ariaHidden,
  'aria-label': ariaLabel,
  'aria-selected': ariaSelected,
  children,
  ellipsizeMode,
  disabled,
  id,
  nativeID,
  numberOfLines,
  onLongPress,
  onPress,
  onPressIn,
  onPressOut,
  onResponderGrant,
  onResponderMove,
  onResponderRelease,
  onResponderTerminate,
  onResponderTerminationRequest,
  onStartShouldSetResponder,
  pressRetentionOffset,
  role,
  selectable,
  selectionColor,
  suppressHighlighting,
  style,
  ...restProps
}: SelectableTextProps & { menu: React.ReactElement<TextMenuProps> }) {
  const processedProps: Record<string, unknown> = restProps;
  const _accessibilityLabel = ariaLabel ?? accessibilityLabel;
  const _accessibilityStateDisabled = ariaDisabled ?? accessibilityState?.disabled;
  const _disabled = disabled ?? _accessibilityStateDisabled;

  // If the disabled prop and accessibilityState.disabled are out of sync but not both in
  // falsy states we need to update the accessibilityState object to use the disabled prop.
  const needsAccessibilityStateDisabledUpdate =
    _disabled !== _accessibilityStateDisabled &&
    ((_disabled != null && _disabled !== false) ||
      (_accessibilityStateDisabled != null && _accessibilityStateDisabled !== false));

  let _accessibilityState: TextProps['accessibilityState'] = accessibilityState;
  if (
    needsAccessibilityStateDisabledUpdate ||
    ariaBusy != null ||
    ariaChecked != null ||
    ariaDisabled != null ||
    ariaExpanded != null ||
    ariaSelected != null
  ) {
    if (_accessibilityState != null) {
      _accessibilityState = {
        busy: ariaBusy ?? _accessibilityState.busy,
        checked: ariaChecked ?? _accessibilityState.checked,
        disabled: _disabled,
        expanded: ariaExpanded ?? _accessibilityState.expanded,
        selected: ariaSelected ?? _accessibilityState.selected,
      };
    } else {
      _accessibilityState = {
        busy: ariaBusy,
        checked: ariaChecked,
        disabled: _disabled,
        expanded: ariaExpanded,
        selected: ariaSelected,
      };
    }
  }

  if (ariaHidden !== undefined) {
    processedProps.accessibilityElementsHidden = ariaHidden;
    if (ariaHidden === true) {
      processedProps.importantForAccessibility = 'no-hide-descendants';
    }
  }

  const _accessible = Platform.select({
    ios: accessible !== false,
    android: accessible == null ? onPress != null || onLongPress != null : accessible,
    default: accessible,
  });

  const isPressable =
    (onPress != null || onLongPress != null || onStartShouldSetResponder != null) &&
    _disabled !== true;

  const shouldUseLinkRole = isPressable && accessibilityRole == null && role == null;

  const _accessibilityRole = accessibilityRole ?? (shouldUseLinkRole ? 'link' : undefined);

  const _role = shouldUseLinkRole ? undefined : role;

  const _selectionColor = selectionColor != null ? processColor(selectionColor) : undefined;

  let _style: TextProps['style'] = style;
  if (__DEV__) {
    if (PressabilityDebug.isEnabled() && onPress != null) {
      _style = [style, { color: 'magenta' }];
    }
  }

  let _numberOfLines = numberOfLines;
  if (_numberOfLines != null && !(_numberOfLines >= 0)) {
    if (__DEV__) {
      console.error(
        `'numberOfLines' in <Text> must be a non-negative number, received: ${_numberOfLines}. The value will be set to 0.`
      );
    }
    _numberOfLines = 0;
  }

  let _selectable = selectable;

  const processedStyle = StyleSheet.flatten(_style);
  if (processedStyle != null) {
    let overrides: TextStyle | null = null;
    if (typeof processedStyle.fontWeight === 'number') {
      overrides = overrides || {};
      overrides.fontWeight = String(processedStyle.fontWeight) as TextStyle['fontWeight'];
    }

    if (processedStyle.userSelect != null) {
      _selectable = userSelectToSelectableMap[processedStyle.userSelect];
      overrides = overrides || {};
      overrides.userSelect = undefined;
    }

    if (processedStyle.verticalAlign != null) {
      overrides = overrides || {};
      overrides.textAlignVertical =
        verticalAlignToTextAlignVerticalMap[processedStyle.verticalAlign];
      overrides.verticalAlign = undefined;
    }

    if (overrides != null) {
      _style = [_style, overrides];
    }
  }

  // React Native applies this when its `defaultTextToOverflowHidden` flag is on,
  // which is the default. The flag is private, so it can't be read here.
  _style = [styles.default, _style];

  const _nativeID = id ?? nativeID;

  if (_accessibilityLabel !== undefined) {
    processedProps.accessibilityLabel = _accessibilityLabel;
  }
  if (_accessibilityRole !== undefined) {
    processedProps.accessibilityRole = _accessibilityRole;
  }
  if (_accessibilityState !== undefined) {
    processedProps.accessibilityState = _accessibilityState;
  }
  if (_nativeID !== undefined) {
    processedProps.nativeID = _nativeID;
  }
  if (_numberOfLines !== undefined) {
    processedProps.numberOfLines = _numberOfLines;
  }
  if (_selectable !== undefined) {
    processedProps.selectable = _selectable;
  }
  if (_style !== undefined) {
    processedProps.style = _style;
  }
  if (_selectionColor !== undefined) {
    processedProps.selectionColor = _selectionColor;
  }
  if (_role !== undefined) {
    processedProps.role = _role;
  }

  let textPressabilityProps: TextPressabilityProps | null = null;
  if (isPressable) {
    textPressabilityProps = {
      onLongPress,
      onPress,
      onPressIn,
      onPressOut,
      onResponderGrant,
      onResponderMove,
      onResponderRelease,
      onResponderTerminate,
      onResponderTerminationRequest,
      onStartShouldSetResponder,
      pressRetentionOffset,
      suppressHighlighting,
    };
  }

  processedProps.accessible = _accessible;
  processedProps.allowFontScaling = allowFontScaling !== false;
  processedProps.disabled = _disabled;
  processedProps.ellipsizeMode = ellipsizeMode ?? 'tail';
  // React Native's renderer accepts raw strings only inside the text host
  // components it knows, such as `RCTText` and `RCTVirtualText`. A virtual text
  // without props adds no text attributes.
  processedProps.children =
    children == null ? children : <NativeVirtualText>{children}</NativeVirtualText>;

  const { ref, onMenuAction, onTouchStart } = useSelectionMenu(
    menu,
    forwardedRef,
    processedProps.onTouchStart as ((event: GestureResponderEvent) => void) | undefined
  );
  processedProps.onMenuAction = onMenuAction;
  processedProps.onTouchStart = onTouchStart;

  const nativeText = isPressable ? (
    <PressableSelectableText
      ref={ref}
      textProps={processedProps as NativeSelectableTextProps}
      textPressabilityProps={textPressabilityProps ?? {}}
    />
  ) : (
    <NativeSelectableText {...(processedProps as NativeSelectableTextProps)} ref={ref} />
  );

  if (children == null) {
    return nativeText;
  }

  // Same shortcut as React Native: children without a JSX element can't contain
  // a nested `Text`, so they don't need the `TextAncestorContext` wrapper.
  if (Array.isArray(children) && children.length <= 3) {
    let hasNonTextChild = false;
    for (const child of children) {
      if (child != null && typeof child === 'object') {
        hasNonTextChild = true;
        break;
      }
    }
    if (!hasNonTextChild) {
      return nativeText;
    }
  } else if (typeof children !== 'object') {
    return nativeText;
  }

  return <TextAncestorContext value>{nativeText}</TextAncestorContext>;
}

function useSelectionMenu(
  menu: React.ReactElement<TextMenuProps>,
  forwardedRef: SelectableTextProps['ref'],
  onTouchStart: ((event: GestureResponderEvent) => void) | undefined
) {
  const { items, handlers } = useMemo(() => readMenuActions(menu), [menu]);
  const handlersRef = useRef(handlers);
  const nativeRef = useRef<unknown>(null);
  const sentItemsJSONRef = useRef<string | null>(null);
  const itemsJSON = JSON.stringify(items);

  useLayoutEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  // A view command for every paragraph that mounts is costly in a long list, so
  // the items go to the native view when a touch first starts on it. The long
  // press that opens the menu takes far longer than the command.
  const sendMenuItems = useCallback(() => {
    if (nativeRef.current != null && sentItemsJSONRef.current !== itemsJSON) {
      setMenuItems(nativeRef.current, JSON.parse(itemsJSON));
      sentItemsJSONRef.current = itemsJSON;
    }
  }, [itemsJSON]);

  useLayoutEffect(() => {
    if (sentItemsJSONRef.current != null) {
      sendMenuItems();
    }
  }, [sendMenuItems]);

  const handleTouchStart = useCallback(
    (event: GestureResponderEvent) => {
      sendMenuItems();
      onTouchStart?.(event);
    },
    [sendMenuItems, onTouchStart]
  );

  const ref = useCallback(
    (instance: React.ComponentRef<typeof RNText> | null) => {
      nativeRef.current = instance;
      if (typeof forwardedRef === 'function') {
        forwardedRef(instance);
      } else if (forwardedRef != null) {
        (forwardedRef as React.RefObject<unknown>).current = instance;
      }
    },
    [forwardedRef]
  );

  const onMenuAction = useCallback((event: NativeSyntheticEvent<SelectionMenuActionEvent>) => {
    handlersRef.current.get(event.nativeEvent.id)?.(event.nativeEvent);
  }, []);

  return { ref, onMenuAction, onTouchStart: handleTouchStart };
}

type TextPressabilityProps = Readonly<{
  onLongPress?: TextProps['onLongPress'];
  onPress?: TextProps['onPress'];
  onPressIn?: TextProps['onPressIn'];
  onPressOut?: TextProps['onPressOut'];
  onResponderGrant?: TextResponderProps['onResponderGrant'];
  onResponderMove?: TextResponderProps['onResponderMove'];
  onResponderRelease?: TextResponderProps['onResponderRelease'];
  onResponderTerminate?: TextResponderProps['onResponderTerminate'];
  onResponderTerminationRequest?: TextResponderProps['onResponderTerminationRequest'];
  onStartShouldSetResponder?: TextResponderProps['onStartShouldSetResponder'];
  pressRetentionOffset?: TextProps['pressRetentionOffset'];
  suppressHighlighting?: TextProps['suppressHighlighting'];
}>;

/*
 * `useTextPressability` from React Native's `Text`, ported line by line.
 */
function useTextPressability({
  onLongPress,
  onPress,
  onPressIn,
  onPressOut,
  onResponderGrant,
  onResponderMove,
  onResponderRelease,
  onResponderTerminate,
  onResponderTerminationRequest,
  onStartShouldSetResponder,
  pressRetentionOffset,
  suppressHighlighting,
}: TextPressabilityProps) {
  const [isHighlighted, setHighlighted] = useState(false);

  const config = useMemo(() => {
    let _onPressIn = onPressIn;
    let _onPressOut = onPressOut;

    // Updating isHighlighted causes unnecessary re-renders for platforms that don't use it
    // in the best case, and cause issues with text selection in the worst case. Forcing
    // the isHighlighted prop to false on all platforms except iOS.
    if (Platform.OS === 'ios') {
      _onPressIn = (event: GestureResponderEvent) => {
        setHighlighted(suppressHighlighting == null || !suppressHighlighting);
        onPressIn?.(event);
      };

      _onPressOut = (event: GestureResponderEvent) => {
        setHighlighted(false);
        onPressOut?.(event);
      };
    }

    return {
      disabled: false,
      pressRectOffset: pressRetentionOffset,
      onLongPress,
      onPress,
      onPressIn: _onPressIn,
      onPressOut: _onPressOut,
    };
  }, [pressRetentionOffset, onLongPress, onPress, onPressIn, onPressOut, suppressHighlighting]);

  const eventHandlers = usePressability(config);

  const eventHandlersForText = useMemo(
    () =>
      eventHandlers == null
        ? null
        : {
            onResponderGrant(event: GestureResponderEvent) {
              eventHandlers.onResponderGrant(event);
              if (onResponderGrant != null) {
                onResponderGrant(event);
              }
            },
            onResponderMove(event: GestureResponderEvent) {
              eventHandlers.onResponderMove(event);
              if (onResponderMove != null) {
                onResponderMove(event);
              }
            },
            onResponderRelease(event: GestureResponderEvent) {
              eventHandlers.onResponderRelease(event);
              if (onResponderRelease != null) {
                onResponderRelease(event);
              }
            },
            onResponderTerminate(event: GestureResponderEvent) {
              eventHandlers.onResponderTerminate(event);
              if (onResponderTerminate != null) {
                onResponderTerminate(event);
              }
            },
            onClick: eventHandlers.onClick,
            onResponderTerminationRequest:
              onResponderTerminationRequest != null
                ? onResponderTerminationRequest
                : eventHandlers.onResponderTerminationRequest,
            onStartShouldSetResponder:
              onStartShouldSetResponder != null
                ? onStartShouldSetResponder
                : eventHandlers.onStartShouldSetResponder,
          },
    [
      eventHandlers,
      onResponderGrant,
      onResponderMove,
      onResponderRelease,
      onResponderTerminate,
      onResponderTerminationRequest,
      onStartShouldSetResponder,
    ]
  );

  return useMemo(
    () => [isHighlighted, eventHandlersForText] as const,
    [isHighlighted, eventHandlersForText]
  );
}

/*
 * `PressableText` from React Native's `Text`, with this package's host component.
 */
function PressableSelectableText({
  ref,
  textProps,
  textPressabilityProps,
}: {
  ref?: React.Ref<React.ComponentRef<typeof RNText>>;
  textProps: NativeSelectableTextProps;
  textPressabilityProps: TextPressabilityProps;
}) {
  const [isHighlighted, eventHandlersForText] = useTextPressability(textPressabilityProps);

  return (
    <NativeSelectableText
      {...textProps}
      {...eventHandlersForText}
      isHighlighted={isHighlighted}
      isPressable
      ref={ref}
    />
  );
}

const userSelectToSelectableMap = {
  auto: true,
  text: true,
  none: false,
  contain: true,
  all: true,
};

const verticalAlignToTextAlignVerticalMap = {
  auto: 'auto',
  top: 'top',
  bottom: 'bottom',
  middle: 'center',
} as const;

const styles = StyleSheet.create({
  // Native components have historically acted like overflow: 'hidden'. We set
  // this, as part of the default style, to let client differentiate with
  // overflow: 'visible'.
  default: {
    overflow: 'hidden',
  },
});
