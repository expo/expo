import React from 'react';
import { StyleSheet, View, LayoutChangeEvent } from 'react-native';

type Props = {
  property?: 'width' | 'height';
  onMeasure?: (dimension: number, name: string) => void;
  name?: string;
  children?: React.ReactNode;
};

type LayoutCallback = (event: LayoutChangeEvent) => void;

function LayoutRuler(props: Props) {
  const [onLayout] = React.useState<LayoutCallback>(() => ({ nativeEvent }: LayoutChangeEvent) => {
    props.onMeasure?.(nativeEvent.layout.height, props.name);
  });

  return (
    <View
      style={props.property === 'width' ? styles.widthRuler : styles.heightRuler}
      onLayout={onLayout}>
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  heightRuler: {
    flexDirection: 'row',
  },
  widthRuler: {
    flexDirection: 'column',
  },
});

export default React.memo(LayoutRuler);
