import { requireNativeView } from 'expo';
import { StyleProp, View, ViewStyle } from 'react-native';

export type ListProps = {
  listStyle?: ListStyle;
  moveEnabled?: boolean;
  deleteEnabled?: boolean;
  data: Array<any>
  style?: StyleProp<ViewStyle>;
  renderItem: ({ item }: { item: any, index: number }) => React.ReactNode;
};

export type NativeListProps = {
    listStyle?: ListStyle;
    style?: StyleProp<ViewStyle>;
    children: React.ReactNode
}



type ListStyle =
  | "automatic"
  | "inset"
  | "insetGrouped"
  | "grouped"
  | "sidebar"
  | "plain";

const ListNativeView: React.ComponentType<
  NativeListProps
> = requireNativeView('ExpoUI', 'ListView');


export function List(props: ListProps) {

  return (
   <ListNativeView listStyle={props.listStyle}  style={[props.style, {flex: 1}]}>
    {props.data.map((item, index) => (
        <View key={index}>
            {props.renderItem({item, index})}
        </View>
    ))}
   </ListNativeView>
  );
}

