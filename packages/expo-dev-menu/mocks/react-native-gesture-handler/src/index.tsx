import * as React from 'react';
import { View, ViewProps } from 'react-native';

function createHandler(): React.ComponentType<React.RefAttributes<any>> {
  class Handler extends React.Component {
    private refHandler = (node: any) => {
      const child = React.Children.only(this.props.children);
      // TODO(TS) fix ref type
      const { ref }: any = child;
      if (ref !== null) {
        if (typeof ref === 'function') {
          ref(node);
        } else {
          ref.current = node;
        }
      }
    };

    render() {
      const child: any = React.Children.only(this.props.children);

      return React.cloneElement(child, {
        ref: this.refHandler,
        collapsable: false,
      });
    }
  }
  return Handler;
}

export interface GestureHandlerRootViewProps extends React.PropsWithChildren<ViewProps> {}

export default function GestureHandlerRootView({ ...rest }: GestureHandlerRootViewProps) {
  return <View {...rest} />;
}

export type PanGestureHandler = typeof PanGestureHandler;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const PanGestureHandler = createHandler();
