import nullthrows from 'nullthrows';
import React from 'react';
import { TouchableOpacity } from 'react-native';

import { AdTriggerViewContext, AdTriggerViewContextValue } from './withNativeAd';

type TouchableProps = {
  onPress?: (...args: any[]) => any;
};

type AdTriggerViewProps<P> = {
  renderInteractiveComponent?: (props: P) => React.ReactElement<P>;
} & P;

export default class AdTriggerView<
  P extends TouchableProps = React.ElementProps<TouchableOpacity>
> extends React.Component<AdTriggerViewProps<P>> {
  _trigger: React.Component<P> | null = null;

  render() {
    return (
      <AdTriggerViewContext.Consumer>
        {(contextValue: AdTriggerViewContextValue | null) => {
          let context = nullthrows(contextValue);

          // Compute the context-dependent props to pass to the interactive component
          let forwardedProps = this._getForwardedProps();
          let props = Object.assign({}, forwardedProps, {
            // Register the trigger component with the ad manager when it is mounted and unmounted
            ref: (component: React.Component<P> | null): void => {
              if (component) {
                this._trigger = component;
                context.registerComponent(component);
              } else {
                context.unregisterComponent(nullthrows(this._trigger));
                this._trigger = null;
              }
            },

            // Notify the ad manager to trigger the ad
            onPress(...args: any[]): any {
              context.onTriggerAd();

              if (forwardedProps.onPress) {
                return forwardedProps.onPress(...args);
              }
            },
          });

          return this.props.renderInteractiveComponent
            ? this.props.renderInteractiveComponent(props)
            : this._renderDefaultInteractiveComponent(props);
        }}
      </AdTriggerViewContext.Consumer>
    );
  }

  // NOTE: This is a helper method to extract the props to forward to the interactive component
  // because TypeScript does not currently support rest objects with generic types in some cases,
  // hence the type assertions
  _getForwardedProps(): P {
    let { renderInteractiveComponent, ...props } = this.props as any;
    return props as P;
  }

  // TODO: change from TouchableOpacity to a Gesture Handler BorderlessButton
  _renderDefaultInteractiveComponent(props: P): React.ReactElement<P> {
    // @ts-ignore: the RN TypeScript declarations are missing the "collapsable" prop
    return <TouchableOpacity {...props} collapsable={false} />;
  }
}
