import * as React from 'react';
import { AppRegistry, Platform } from 'react-native';
import withExpoRoot from './withExpoRoot';
import DevLoadingView from '../environment/DevLoadingView';
class ExpoDevAppContainer extends React.Component {
    render() {
        return (<>
        {this.props.children}
        <DevLoadingView />
      </>);
    }
}
export default function registerRootComponent(component) {
    if (__DEV__ && Platform.OS === 'ios') {
        // @ts-ignore
        AppRegistry.setWrapperComponentProvider(() => ExpoDevAppContainer);
    }
    AppRegistry.registerComponent('main', () => withExpoRoot(component));
}
//# sourceMappingURL=registerRootComponent.js.map