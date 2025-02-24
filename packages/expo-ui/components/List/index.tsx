import { requireNativeView } from 'expo';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';

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

const ListView: React.ComponentType<ListProps> = requireNativeView('ExpoUI', 'ListView');

export function ListItem(props: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const Wrapper = props.onPress ? Pressable : View;

  return (
    <Wrapper
      style={[
        {
          position: 'absolute',
          left: 0,
          paddingHorizontal: 20 + 16,
        },
        props.style,
      ]}
      collapsable={false}
      onPress={props.onPress}>
      {props.children}
    </Wrapper>
  );
}

export function List(props: ListProps) {
  return <ListView {...props} />;
}
