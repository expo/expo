import * as React from 'react';
import { AppRegistry } from 'react-native';
import withExpoRoot from './withExpoRoot';
export default function registerRootComponent(component) {
    const App = withExpoRoot(component);
    const RootComponent = props => React.createElement(App, Object.assign({}, props));
    AppRegistry.registerComponent('main', () => RootComponent);
    const rootTag = document.getElementById('root') ?? document.getElementById('main');
    AppRegistry.runApplication('main', { rootTag });
}
//# sourceMappingURL=registerRootComponent.web.js.map