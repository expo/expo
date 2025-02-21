import { requireNativeView } from 'expo';
import { StyleProp, ViewStyle } from 'react-native';

export type ListProps = {
  /**
   * Custom styles for the progress component.
   */
  style?: StyleProp<ViewStyle>;
};

const ListView: React.ComponentType<ListProps> = requireNativeView('ExpoUI', 'ListView');

export function List(props: ListProps) {
  return <ListView {...props} />;
}
