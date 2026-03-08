import { requireNativeView } from 'expo';

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
   * A JavaScript function source string that takes `(item, index)` and returns
   * a descriptor tree built with `createElement()`.
   *
   * `createElement` is available as a global in the UI runtime.
   *
   * @example
   * ```tsx
   * renderItemSource={`(function(item, index) {
   *   var h = createElement;
   *   return h('HStack', { spacing: 8 },
   *     h('Text', { content: item.title })
   *   );
   * })`}
   * ```
   */
  renderItemSource: string;
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
 * JS thread, `WorkletList` evals the `renderItemSource` function into the UI
 * runtime and calls it synchronously when SwiftUI's `ForEach` requests each item.
 * This eliminates blank cells during fast scrolling.
 *
 * Supported descriptor types: `Text`, `HStack`, `VStack`, `ZStack`, `Image`,
 * `Label`, `Spacer`, `Divider`.
 *
 * @experimental This is a proof-of-concept for UI-thread list rendering.
 */
export function WorkletList<T extends Record<string, unknown>>(props: WorkletListProps<T>) {
  const { data, renderItemSource, ...restProps } = props;

  return (
    <WorkletListNativeView
      {...restProps}
      data={data as Record<string, unknown>[]}
      renderItemSource={renderItemSource}
    />
  );
}
