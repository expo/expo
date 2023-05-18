import React, {
  ComponentType,
  useMemo,
  useEffect,
  useReducer,
  useState,
} from "react";
import { View, Pressable } from "react-native";

import { ContainerRuntime, InteropMeta, StyleMeta } from "../../types";
import { AnimationInterop } from "./animations";
import { flattenStyle } from "./flatten-style";
import {
  ContainerContext,
  VariableContext,
  globalStyles,
  styleMetaMap,
} from "./globals";
import { useInteractionHandlers, useInteractionSignals } from "./interaction";
import { useComputation } from "./signals";
import { StyleSheet } from "./stylesheet";

type CSSInteropWrapperProps = {
  __component: ComponentType<any>;
  __styleKeys: string[];
  __next: boolean;
} & Record<string, any>;

/**
 * This is the default implementation of the CSS interop function. It is used to add CSS styles to React Native components.
 * @param jsx The JSX function that should be used to create the React elements.
 * @param type The React component type that should be rendered.
 * @param props The props object that should be passed to the component.
 * @param key The optional key to use for the component.
 * @param next Indicates whether this component should be rendered as a next.js component.
 * @returns The element rendered via the suppled JSX function
 */
export function defaultCSSInterop(
  jsx: Function,
  type: ComponentType<any>,
  { ...props }: any,
  key: string,
  next = false
) {
  // This sets the component type and specifies the style keys that should be used.
  props.__component = type;
  props.__styleKeys = ["style"];
  props.__next = next;

  /**
   * If the development environment is enabled, we should use the DevOnlyCSSInteropWrapper to wrap every component.
   * This wrapper subscribes to StyleSheet.register, so it can handle hot reloading of styles.
   */
  if (__DEV__) {
    return jsx(DevOnlyCSSInteropWrapper, props, key);
  }

  // Rewrite the className prop to a style object.
  props = classNameToStyle(props);

  // If the styles are dynamic, we need to wrap the component with the CSSInteropWrapper to handle style updates.
  return areStylesDynamic(props.style)
    ? jsx(CSSInteropWrapper, props, key)
    : jsx(type, props, key);
}

/**
 * This is the DevOnlyCSSInteropWrapper that should be used in development environments to handle async style updates.
 * It subscribes to StyleSheet.register, so it can handle style changes that may occur asynchronously.
 */
const DevOnlyCSSInteropWrapper = React.forwardRef(
  function DevOnlyCSSInteropWrapper(
    {
      __component: Component,
      __styleKeys,
      __next,
      ...props
    }: CSSInteropWrapperProps,
    ref
  ) {
    // This uses a reducer and the useEffect hook to subscribe to StyleSheet.register.
    const [, render] = useReducer(rerenderReducer, 0);
    useEffect(() => StyleSheet.__subscribe(render), []);

    // This applies the styles using the classNameToStyle function, which returns the style object.
    props = classNameToStyle(props);

    // If the styles are dynamic, we need to wrap the component with the CSSInteropWrapper to handle style updates.
    return areStylesDynamic(props.style) ? (
      <CSSInteropWrapper
        {...props}
        ref={ref}
        __component={Component}
        __styleKeys={__styleKeys}
        __skipCssInterop
        __next={__next}
      />
    ) : (
      <Component {...props} ref={ref} __skipCssInterop />
    );
  }
);

/**
 * This component is a wrapper that handles the styling interop between React Native and CSS functionality
 *
 * @remarks
 * The CSSInteropWrapper function has an internal state, interopMeta, which holds information about the styling props,
 * like if it's animated, if it requires a layout listener, if it has inline containers, etc. When a style prop changes, the component
 * calculates the new style and meta again using a helper function called flattenStyle.
 *
 * @param __component - Component to be rendered
 * @param __styleKeys - List of keys with the style props that need to be computed
 * @param __next - Flag indicating if should we should advanced featuers
 * @param $props - Any other props to be passed to the component
 * @param ref - Ref to the component
 */
const CSSInteropWrapper = React.forwardRef(function CSSInteropWrapper(
  {
    __component: Component,
    __styleKeys,
    __next: isNext,
    ...$props
  }: CSSInteropWrapperProps,
  ref
) {
  const [, rerender] = React.useReducer(rerenderReducer, 0);
  const inheritedVariables = React.useContext(VariableContext);
  const inheritedContainers = React.useContext(ContainerContext);
  const interaction = useInteractionSignals();

  /**
   * The purpose of interopMeta is to reduce the number of operations performed in the render function.
   * The meta is entirely derived from the computed styles, so we only need to calculate it when a style changes.
   *
   * The interopMeta object holds information about the styling props, like if it's animated, if it requires layout,
   * if it has inline containers, etc.
   *
   * The object is updated using the derived state pattern. The computation is done in the for loop below and
   * is stored in a variable $interopMeta. After that, the component checks if $interopMeta is different from interopMeta
   * to update the state.
   */
  const [$interopMeta, setInteropMeta] = useState<InteropMeta>(initialMeta);
  let interopMeta = $interopMeta;

  for (const key of __styleKeys) {
    /**
     * Create a computation that will flatten the style object.
     * Any signals read while the computation is running will be subscribed to.
     *
     * useComputation handles the reactivity/memoization
     * flattenStyle handles converting the schema to a style object and collecting the metadata
     */
    /* eslint-disable react-hooks/rules-of-hooks -- __styleKeys is immutable */
    const style = useComputation(
      () => {
        return flattenStyle($props[key], {
          interaction,
          variables: inheritedVariables,
          containers: inheritedContainers,
        });
      },
      [$props[key], inheritedVariables, inheritedContainers],
      rerender
    );
    /* eslint-enable react-hooks/rules-of-hooks */

    /*
     * Recalculate the interop meta when a style change occurs, due to a style update.
     * Rather than comparing the changes, we recalculate the entire meta.
     * To update the interop meta, we modify the `styledProps` and `styledPropsMeta` properties,
     * which will be flattened later.
     */
    if (interopMeta.styledProps[key] !== style) {
      const meta = styleMetaMap.get(style) ?? defaultMeta;

      interopMeta = {
        ...interopMeta,
        styledProps: { ...interopMeta.styledProps, [key]: style },
        styledPropsMeta: {
          ...interopMeta.styledPropsMeta,
          [key]: {
            animated: Boolean(meta.animations),
            transition: Boolean(meta.transition),
            requiresLayout: Boolean(meta.requiresLayout),
            variables: meta.variables,
            containers: meta.container?.names,
            hasActive: meta.pseudoClasses?.active,
            hasHover: meta.pseudoClasses?.hover,
            hasFocus: meta.pseudoClasses?.focus,
          },
        },
      };
    }
  }

  // interopMeta has changed since last render (or it's the first render)
  // Recalculate the derived attributes and rerender
  if (interopMeta !== $interopMeta) {
    let hasInlineVariables = false;
    let hasInlineContainers = false;
    let requiresLayout = false;
    let hasActive: boolean | undefined = false;
    let hasHover: boolean | undefined = false;
    let hasFocus: boolean | undefined = false;

    const variables = {};
    const containers: Record<string, ContainerRuntime> = {};
    const animatedProps = new Set<string>();
    const transitionProps = new Set<string>();

    for (const key of __styleKeys) {
      const meta = interopMeta.styledPropsMeta[key];

      Object.assign(variables, meta.variables);

      if (meta.variables) hasInlineVariables = true;
      if (meta.animated) animatedProps.add(key);
      if (meta.transition) transitionProps.add(key);
      if (meta.containers) {
        hasInlineContainers = true;
        const runtime: ContainerRuntime = {
          type: "normal",
          interaction,
          style: interopMeta.styledProps[key],
        };

        containers.__default = runtime;
        for (const name of meta.containers) {
          containers[name] = runtime;
        }
      }

      requiresLayout ||= hasInlineContainers || meta.requiresLayout;
      hasActive ||= hasInlineContainers || meta.hasActive;
      hasHover ||= hasInlineContainers || meta.hasHover;
      hasFocus ||= hasInlineContainers || meta.hasFocus;
    }

    let animationInteropKey = undefined;
    if (animatedProps.size > 0 || transitionProps.size > 0) {
      animationInteropKey = [...animatedProps, ...transitionProps].join(":");
    }

    interopMeta = {
      ...interopMeta,
      variables,
      containers,
      animatedProps,
      transitionProps,
      requiresLayout,
      hasInlineVariables,
      hasInlineContainers,
      animationInteropKey,
      hasActive,
      hasHover,
      hasFocus,
    };

    setInteropMeta(interopMeta);
  }

  if (
    Component === View &&
    (interopMeta.hasActive || interopMeta.hasHover || interopMeta.hasFocus)
  ) {
    Component = Pressable;
  }

  const variables = useMemo(
    () => Object.assign({}, inheritedVariables, $interopMeta.variables),
    [inheritedVariables, $interopMeta.variables]
  );

  const containers = useMemo(
    () => Object.assign({}, inheritedContainers, $interopMeta.containers),
    [inheritedContainers, $interopMeta.containers]
  );

  // This doesn't need to be memoized as it's values will be spread across the component
  const props: Record<string, any> = {
    ...$props,
    ...interopMeta.styledProps,
    ...useInteractionHandlers($props, interaction, interopMeta),
  };

  let children: JSX.Element = props.children;

  if ($interopMeta.hasInlineVariables) {
    children = (
      <VariableContext.Provider value={variables}>
        {children}
      </VariableContext.Provider>
    );
  }

  if ($interopMeta.hasInlineContainers) {
    children = (
      <ContainerContext.Provider value={containers}>
        {children}
      </ContainerContext.Provider>
    );
  }

  if (isNext && $interopMeta.animationInteropKey) {
    return (
      <AnimationInterop
        {...props}
        ref={ref}
        key={$interopMeta.animationInteropKey}
        __component={Component}
        __variables={variables}
        __containers={inheritedContainers}
        __interaction={interaction}
        __interopMeta={$interopMeta}
        __skipCssInterop
      >
        {children}
      </AnimationInterop>
    );
  } else {
    return (
      <Component {...props} ref={ref} __skipCssInterop>
        {children}
      </Component>
    );
  }
});

/**
 * Maps each class name in the `className` property of the input object
 * to its corresponding global style object and combines the resulting
 * array of styles with any existing styles in the `style` property of
 * the input object.
 *
 * @param props - An object that may contain a `className` property and a `style` property
 * @returns The modified input object with updated `style` property
 */
function classNameToStyle({ className, ...props }: Record<string, unknown>) {
  if (typeof className === "string") {
    // Split className string into an array of class names, then map each class
    // name to its corresponding global style object, if one exists.
    const classNameStyle = className
      .split(/\s+/)
      .map((s) => globalStyles.get(s));

    // Combine the resulting array of styles with any existing styles in the `style` property
    // of the input object.
    props.style = Array.isArray(props.style)
      ? [...classNameStyle, ...props.style]
      : props.style
      ? [...classNameStyle, props.style]
      : classNameStyle;

    // If there is only one style in the resulting array, replace the array with that single style.
    if (Array.isArray(props.style) && props.style.length <= 1) {
      props.style = props.style[0];
    }
  }

  return props;
}

/**
 * Determines whether a style object or array of style objects contains dynamic styles.
 * @param style The style object or array of style objects to check.
 * @returns True if the style object or array contains dynamic styles; otherwise, false.
 */
function areStylesDynamic(style: any): boolean {
  if (!style) return false; // If there is no style, it can't be dynamic.
  if (styleMetaMap.has(style)) return true; // If it's already tagged, it's dynamic.

  // If we have an array of styles, check each one.
  // We can then tag the array so we don't have to check it again.
  if (Array.isArray(style) && style.some(areStylesDynamic)) {
    styleMetaMap.set(style, {}); // Tag the array so we don't have to check it again.
    return true;
  }

  return false;
}

/* Micro optimizations. Save these externally so they are not recreated every render  */
const rerenderReducer = (acc: number) => acc + 1;
const defaultMeta: StyleMeta = { container: { names: [], type: "normal" } };
const initialMeta: InteropMeta = {
  styledProps: {},
  styledPropsMeta: {},
  variables: {},
  containers: {},
  animatedProps: new Set(),
  transitionProps: new Set(),
  requiresLayout: false,
  hasInlineVariables: false,
  hasInlineContainers: false,
};
