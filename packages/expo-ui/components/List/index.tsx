import { requireNativeView } from 'expo';
import { Platform, Pressable, StyleProp, View, ViewStyle } from 'react-native';

export type ListProps = {
  /**
   * Custom styles for the progress component.
   */
  style?: StyleProp<ViewStyle>;

  children?: React.ReactNode;
};

export type ListItemProps = {
  onPress?: () => void;
};

let ListView: React.ComponentType<ListProps> | null;

if (Platform.OS === 'ios') {
  ListView = requireNativeView('ExpoUI', 'ListView');
}

export function ListItem(props: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const Wrapper = props.onPress ? Pressable : View;

  return (
    <Wrapper
      style={[
        Platform.select({
          ios: {
            position: 'absolute',
            left: 0,
            paddingHorizontal: 20 + 16,
          },
        }),
        props.style,
      ]}
      collapsable={false}
      onPress={props.onPress}>
      {props.children}
    </Wrapper>
  );
}

export function List(props: ListProps) {
  if (!ListView) {
    return null;
  }
  return <ListView {...props} />;
}
