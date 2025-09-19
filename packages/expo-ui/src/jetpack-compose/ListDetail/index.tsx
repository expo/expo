import { requireNativeView } from 'expo';
import { type ViewProps } from 'react-native';

export interface ListDetailProps extends ViewProps {}

export function ListDetail(props: ListDetailProps) {
  if (process.env.EXPO_OS === 'android') {
    const ListDetailNativeView = requireNativeView(
      'ExpoUI',
      'ListDetailView'
    ) as React.ComponentType<ListDetailProps>;
    return <ListDetailNativeView {...props} />;
  }
  return null;
}

export interface ListContentProps extends ViewProps {}
export interface DetailContentProps extends ViewProps {}

export function ListContent(props: ListContentProps) {
  if (process.env.EXPO_OS === 'android') {
    const ListContentNativeView = requireNativeView(
      'ExpoUI',
      'ListContentView'
    ) as React.ComponentType<ListContentProps>;
    return <ListContentNativeView {...props} />;
  }
  return null;
}

const DetailContentNativeView =
  process.env.EXPO_OS === 'android'
    ? (requireNativeView('ExpoUI', 'DetailContentView') as React.ComponentType<DetailContentProps>)
    : null;

export const DetailContent = DetailContentNativeView;
