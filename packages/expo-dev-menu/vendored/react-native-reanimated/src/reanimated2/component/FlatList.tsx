import React from 'react';
import { FlatList, FlatListProps, LayoutChangeEvent } from 'react-native';
import ReanimatedView from './View';
import createAnimatedComponent from '../../createAnimatedComponent';
import { ILayoutAnimationBuilder } from '../layoutReanimation/animationBuilder/commonTypes';

const AnimatedFlatList = createAnimatedComponent(FlatList as any) as any;

const createCellRenderer = (itemLayoutAnimation?: ILayoutAnimationBuilder) => {
  const cellRenderer: React.FC<{
    onLayout: (event: LayoutChangeEvent) => void;
  }> = (props) => {
    return (
      <ReanimatedView layout={itemLayoutAnimation} onLayout={props.onLayout}>
        {props.children}
      </ReanimatedView>
    );
  };

  return cellRenderer;
};

export interface ReanimatedFlatlistProps<ItemT> extends FlatListProps<ItemT> {
  itemLayoutAnimation?: ILayoutAnimationBuilder;
}

type ReanimatedFlatListFC<T = any> = React.FC<ReanimatedFlatlistProps<T>>;

const ReanimatedFlatlist: ReanimatedFlatListFC = ({
  itemLayoutAnimation,
  ...restProps
}) => {
  const cellRenderer = React.useMemo(
    () => createCellRenderer(itemLayoutAnimation),
    []
  );
  return (
    <AnimatedFlatList {...restProps} CellRendererComponent={cellRenderer} />
  );
};

export default ReanimatedFlatlist;
