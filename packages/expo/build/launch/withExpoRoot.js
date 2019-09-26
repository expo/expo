import * as Font from 'expo-font';
import * as React from 'react';
import { StyleSheet } from 'react-native';
import Notifications from '../Notifications/Notifications';
import RootErrorBoundary from './RootErrorBoundary';
export default function withExpoRoot(AppRootComponent) {
    return class ExpoRootComponent extends React.Component {
        componentWillMount() {
            if (StyleSheet.setStyleAttributePreprocessor) {
                StyleSheet.setStyleAttributePreprocessor('fontFamily', Font.processFontFamily);
            }
            const { exp } = this.props;
            if (exp.notification) {
                Notifications._setInitialNotification(exp.notification);
            }
        }
        render() {
            if (__DEV__) {
                return (<RootErrorBoundary>
            <AppRootComponent {...this.props}/>
          </RootErrorBoundary>);
            }
            else {
                return <AppRootComponent {...this.props}/>;
            }
        }
    };
}
//# sourceMappingURL=withExpoRoot.js.map