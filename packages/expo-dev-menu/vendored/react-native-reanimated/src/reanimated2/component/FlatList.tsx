import React, { ForwardedRef, forwardRef } from 'react';
import { FlatList, FlatListProps, LayoutChangeEvent } from 'react-native';
import ReanimatedView from './View';
import createAnimatedComponent from '../../createAnimatedComponent';
import { ILayoutAnimationBuilder } from '../layoutReanimation/animationBuilder/commonTypes';

const AnimatedFlatList = createAnimatedComponent(FlatList as any) as any;

interface AnimatedFlatListProps {
  onLayout: (event: LayoutChangeEvent) => void;
  // implicit `children` prop has been removed in @types/react^18.0.0
  children: React.ReactNode;
}

const createCellRenderer = (itemLayoutAnimation?: ILayoutAnimationBuilder) => {
  const cellRenderer = (props: AnimatedFlatListProps) => {
    return (
      <ReanimatedView layout={itemLayoutAnimation} onLayout={props.onLayout}>
        {props.children}
      </ReanimatedView>
    );
  };

  return cellRenderer;
};

export interface ReanimatedFlatListProps<ItemT> extends FlatListProps<ItemT> {
  itemLayoutAnimation?: ILayoutAnimationBuilder;
}

type ReanimatedFlatListFC<T = any> = React.FC<ReanimatedFlatListProps<T>>;

const ReanimatedFlatlist: ReanimatedFlatListFC = forwardRef(
  (props: ReanimatedFlatListProps<any>, ref: ForwardedRef<FlatList>) => {
    const { itemLayoutAnimation, ...restProps } = props;

    const cellRenderer = React.useMemo(
      () => createCellRenderer(itemLayoutAnimation),
      []
    );

    return (
      <AnimatedFlatList
        ref={ref}
        {...restProps}
        CellRendererComponent={cellRenderer}
      />
    );
  }
);

export default ReanimatedFlatlist;
