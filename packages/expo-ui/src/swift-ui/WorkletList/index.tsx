import { requireNativeView } from 'expo';
import * as React from 'react';

import { type CommonViewModifierProps } from '../types';

const WorkletListNativeView: React.ComponentType<NativeWorkletListProps> =
  requireNativeView<NativeWorkletListProps>('ExpoUI', 'WorkletListView');

/**
 * Props for the WorkletList component.
 */
export interface WorkletListProps<T extends Record<string, unknown> = Record<string, unknown>>
  extends CommonViewModifierProps {
  /**
   * Array of data items to render. Each item must be a JSON-serializable object.
   */
  data: T[];

  /**
   * A function that takes `(item, index)` and returns a descriptor tree
   * built with `createElement(type, props, ...children)`.
   *
   * This function runs on the UI thread — it must be a **pure function** of
   * its arguments and marked with `'worklet'`. It cannot capture closure
   * variables from the surrounding scope. Use `globalThis.createElement`
   * (available in the UI runtime) and the function parameters.
   *
   * @example
   * ```tsx
   * renderItem={(item, index) => {
   *   'worklet';
   *   const h = globalThis.createElement;
   *   return h('HStack', { spacing: 8 },
   *     h('Image', { systemName: item.icon }),
   *     h('Text', { content: item.title })
   *   );
   * }}
   * ```
   */
  renderItem: (item: T, index: number) => unknown;
}

type NativeWorkletListProps = CommonViewModifierProps & {
  data: Record<string, unknown>[];
  renderItemSource: string;
};

/**
 * An experimental list component that renders items via a render function
 * running on the UI thread, enabling synchronous rendering for SwiftUI's lazy list.
 *
 * Unlike the standard `List` which eagerly renders all React children on the
 * JS thread, `WorkletList` runs `renderItem` synchronously on the UI thread
 * when SwiftUI's lazy container requests each item. This eliminates blank cells
 * during fast scrolling.
 *
 * **Important:** `renderItem` must be a pure function — no closure captures.
 * Only the function parameters and `createElement` (a global) are available.
 *
 * Supported descriptor types: `Text`, `HStack`, `VStack`, `ZStack`, `Image`,
 * `Label`, `Spacer`, `Divider`.
 *
 * @experimental This is a proof-of-concept for UI-thread list rendering.
 */
export function WorkletList<T extends Record<string, unknown>>(props: WorkletListProps<T>) {
  const { data, renderItem, ...restProps } = props;

  // Extract function source from the worklet's __initData (set by the Babel plugin
  // at compile time). Hermes compiles JS to bytecode, so Function.prototype.toString()
  // won't work — we rely on the worklet plugin to preserve the source.
  const renderItemSource = React.useMemo(() => {
    const fn = renderItem as any;
    if (fn.__initData?.code) {
      return `(${fn.__initData.code})`;
    }
    // Fallback for non-Hermes engines (e.g. V8 in debug mode)
    return `(${renderItem.toString()})`;
  }, [renderItem]);

  return (
    <WorkletListNativeView
      {...restProps}
      data={data as Record<string, unknown>[]}
      renderItemSource={renderItemSource}
    />
  );
}
