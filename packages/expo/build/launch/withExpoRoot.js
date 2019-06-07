import * as Font from 'expo-font';
import * as React from 'react';
import { StyleSheet } from 'react-native';
import RootErrorBoundary from './RootErrorBoundary';
export default function withExpoRoot(AppRootComponent) {
    return function ExpoRoot(props) {
        const didInitialize = React.useRef(false);
        if (!didInitialize.current) {
            if (StyleSheet.setStyleAttributePreprocessor) {
                StyleSheet.setStyleAttributePreprocessor('fontFamily', Font.processFontFamily);
            }
            didInitialize.current = true;
        }
        if (__DEV__) {
            return (<RootErrorBoundary>
          <AppRootComponent {...props}/>
        </RootErrorBoundary>);
        }
        else {
            return <AppRootComponent {...props}/>;
        }
    };
}
//# sourceMappingURL=withExpoRoot.js.map