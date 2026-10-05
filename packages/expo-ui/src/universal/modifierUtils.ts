import type { ModifierConfig } from '../types';

/**
 * Drops derived modifiers that the user overrides through the `modifiers`
 * escape hatch. A user-supplied modifier takes ownership of its `$type`, so
 * the component skips the modifier of that type it would otherwise derive
 * from `style`, `variant`, and similar props.
 *
 * Only pass style-derived modifiers as `derived`. Modifiers backing
 * functional props (for example `onPress`, `onAppear`, `disabled`) must not
 * go through this filter, or a user modifier of the same type would silently
 * disable the prop.
 */
export function omitUserOverridden<T extends { $type: string }>(
  derived: T[],
  userModifiers?: readonly ModifierConfig[],
  preservedTypes?: ReadonlySet<string>
): T[] {
  if (!userModifiers?.length) {
    return derived;
  }
  const userTypes = new Set(userModifiers.map((modifier) => modifier.$type));
  return derived.filter(
    (modifier) => preservedTypes?.has(modifier.$type) || !userTypes.has(modifier.$type)
  );
}

/**
 * A fixed size in density-independent pixels, or a percentage of the parent.
 * `'50%'` is half of the parent's content size on that axis.
 */
export type UniversalDimension = number | `${number}%` | null;

export type SerializedUniversalDimensions = {
  widthPoints?: number;
  widthFraction?: number;
  heightPoints?: number;
  heightFraction?: number;
};

export type UniversalLayoutPlatform = 'android' | 'ios';

type UniversalDimensionStyle = {
  width?: unknown;
  height?: unknown;
};

type DimensionAxis = 'width' | 'height';

const PERCENTAGE_PATTERN = /^(?:\d+(?:\.\d+)?|\.\d+)%$/;
const warnedInvalidDimensions = new Set<string>();

function isDevelopment(): boolean {
  const globals = globalThis as typeof globalThis & {
    __DEV__?: boolean;
    process?: { env?: { NODE_ENV?: string } };
  };
  return globals.__DEV__ ?? globals.process?.env?.NODE_ENV !== 'production';
}

function warnInvalidDimension(componentName: string, axis: DimensionAxis, value: unknown): void {
  if (!isDevelopment()) return;

  const warningKey = `${componentName}:${axis}`;
  if (warnedInvalidDimensions.has(warningKey)) return;
  warnedInvalidDimensions.add(warningKey);

  console.warn(
    `[Expo UI] Ignoring invalid ${axis} on ${componentName}: ${String(value)}. ` +
      'Expected a finite, non-negative number or percentage.'
  );
}

function serializeDimension(
  value: unknown,
  componentName: string,
  axis: DimensionAxis
): { points?: number; fraction?: number } {
  if (value == null) return {};

  if (typeof value === 'number') {
    if (Number.isFinite(value) && value >= 0) return { points: value };
    warnInvalidDimension(componentName, axis, value);
    return {};
  }

  if (typeof value === 'string' && PERCENTAGE_PATTERN.test(value)) {
    const percentage = Number(value.slice(0, -1));
    if (Number.isFinite(percentage) && percentage >= 0) {
      return { fraction: percentage / 100 };
    }
  }

  warnInvalidDimension(componentName, axis, value);
  return {};
}

export function serializeUniversalDimensions(
  style: UniversalDimensionStyle | undefined,
  componentName = 'universal component'
): SerializedUniversalDimensions {
  const width = serializeDimension(style?.width, componentName, 'width');
  const height = serializeDimension(style?.height, componentName, 'height');

  return {
    widthPoints: width.points,
    widthFraction: width.fraction,
    heightPoints: height.points,
    heightFraction: height.fraction,
  };
}

/**
 * Which axes a user modifier already owns.
 * `weight` is intentionally ignored: it applies to the parent's main axis, and
 * the stack still needs an explicit cross-axis size from `style`.
 */
export function getUserSizingOverrides(
  userModifiers: readonly ModifierConfig[] | undefined,
  platform: UniversalLayoutPlatform
): { width: boolean; height: boolean } {
  let width = false;
  let height = false;

  for (const modifier of userModifiers ?? []) {
    if (platform === 'android') {
      if (modifier.$type === 'size' || modifier.$type === 'fillMaxSize') {
        width = true;
        height = true;
      } else if (
        modifier.$type === 'width' ||
        modifier.$type === 'fillMaxWidth' ||
        modifier.$type === 'wrapContentWidth' ||
        (modifier.$type === 'defaultMinSize' && modifier.minWidth != null)
      ) {
        width = true;
      } else if (
        modifier.$type === 'height' ||
        modifier.$type === 'fillMaxHeight' ||
        modifier.$type === 'wrapContentHeight' ||
        (modifier.$type === 'defaultMinSize' && modifier.minHeight != null)
      ) {
        height = true;
      }
      continue;
    }

    if (modifier.$type === 'frame') {
      width ||=
        modifier.width != null ||
        modifier.minWidth != null ||
        modifier.idealWidth != null ||
        modifier.maxWidth != null;
      height ||=
        modifier.height != null ||
        modifier.minHeight != null ||
        modifier.idealHeight != null ||
        modifier.maxHeight != null;
    } else if (modifier.$type === 'containerRelativeFrame') {
      width ||= modifier.axes === 'horizontal' || modifier.axes === 'both';
      height ||= modifier.axes === 'vertical' || modifier.axes === 'both';
    } else if (modifier.$type === 'fixedSize') {
      const hasExplicitAxis = modifier.horizontal != null || modifier.vertical != null;
      width ||= hasExplicitAxis ? modifier.horizontal === true : true;
      height ||= hasExplicitAxis ? modifier.vertical === true : true;
    }
  }

  return { width, height };
}

export function omitUserOverriddenDimensions(
  dimensions: SerializedUniversalDimensions,
  userModifiers: readonly ModifierConfig[] | undefined,
  platform: UniversalLayoutPlatform
): SerializedUniversalDimensions {
  const overrides = getUserSizingOverrides(userModifiers, platform);
  return {
    widthPoints: overrides.width ? undefined : dimensions.widthPoints,
    widthFraction: overrides.width ? undefined : dimensions.widthFraction,
    heightPoints: overrides.height ? undefined : dimensions.heightPoints,
    heightFraction: overrides.height ? undefined : dimensions.heightFraction,
  };
}

export function createUniversalLayoutModifier(
  dimensions: SerializedUniversalDimensions
): ModifierConfig | undefined {
  const hasDimension = Object.values(dimensions).some((value) => value != null);
  return hasDimension ? { $type: 'universalLayout', ...dimensions } : undefined;
}

export function resetUniversalDimensionWarningsForTests(): void {
  warnedInvalidDimensions.clear();
}
