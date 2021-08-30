import nullthrows from 'nullthrows';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { AdTriggerViewContext } from './withNativeAd';
export default class AdTriggerView extends React.Component {
    _trigger = null;
    render() {
        return (React.createElement(AdTriggerViewContext.Consumer, null, (contextValue) => {
            const context = nullthrows(contextValue);
            // Compute the context-dependent props to pass to the interactive component
            const forwardedProps = this._getForwardedProps();
            const props = Object.assign({}, forwardedProps, {
                // Register the trigger component with the ad manager when it is mounted and unmounted
                ref: (component) => {
                    if (component) {
                        this._trigger = component;
                        context.registerComponent(component);
                    }
                    else {
                        context.unregisterComponent(nullthrows(this._trigger));
                        this._trigger = null;
                    }
                },
                // Notify the ad manager to trigger the ad
                onPress(...args) {
                    context.onTriggerAd();
                    if (forwardedProps.onPress) {
                        return forwardedProps.onPress(...args);
                    }
                },
            });
            return this.props.renderInteractiveComponent
                ? this.props.renderInteractiveComponent(props)
                : this._renderDefaultInteractiveComponent(props);
        }));
    }
    // NOTE: This is a helper method to extract the props to forward to the interactive component
    // because TypeScript does not currently support rest objects with generic types in some cases,
    // hence the type assertions
    _getForwardedProps() {
        const { renderInteractiveComponent, ...props } = this.props;
        return props;
    }
    // TODO: change from TouchableOpacity to a Gesture Handler BorderlessButton
    _renderDefaultInteractiveComponent(props) {
        return React.createElement(TouchableOpacity, { ...props, collapsable: false });
    }
}
//# sourceMappingURL=AdTriggerView.js.map