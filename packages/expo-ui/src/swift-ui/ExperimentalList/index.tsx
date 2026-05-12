import { requireNativeView } from 'expo';

import { useWorkletProp } from '../../State/useWorkletProp';
import { getStateId } from '../../State/utils';

export type FontToken =
  | 'largeTitle'
  | 'title'
  | 'title2'
  | 'title3'
  | 'headline'
  | 'subheadline'
  | 'body'
  | 'callout'
  | 'caption'
  | 'caption2'
  | 'footnote';

export type FontWeightToken =
  | 'ultraLight'
  | 'thin'
  | 'light'
  | 'regular'
  | 'medium'
  | 'semibold'
  | 'bold'
  | 'heavy'
  | 'black';

export type ViewDescription =
  | {
      type: 'VStack' | 'HStack';
      alignment?: 'leading' | 'center' | 'trailing' | 'top' | 'bottom';
      spacing?: number;
      children: ViewDescription[];
    }
  | {
      type: 'Text';
      text: string;
      font?: FontToken;
      weight?: FontWeightToken;
      foregroundColor?: string;
    }
  | {
      type: 'Image';
      systemImage: string;
      foregroundColor?: string;
    }
  | { type: 'Spacer' };

export type ExperimentalListRenderItem<T> = (item: T, index: number) => ViewDescription;

export type ExperimentalListProps<T> = {
  data: readonly T[];
  renderItem: ExperimentalListRenderItem<T>;
  spacing?: number;
};

type NativeExperimentalListProps = {
  data: readonly unknown[];
  renderItem?: number | null;
  spacing?: number;
};

const ExperimentalListNativeView: React.ComponentType<NativeExperimentalListProps> =
  requireNativeView('ExpoUI', 'ExperimentalListView');

export function ExperimentalList<T>({ data, renderItem, spacing }: ExperimentalListProps<T>) {
  const renderItemId = useWorkletProp(renderItem as (...args: unknown[]) => unknown, 'renderItem');

  return (
    <ExperimentalListNativeView
      data={data}
      renderItem={getStateId(renderItemId)}
      spacing={spacing}
    />
  );
}
