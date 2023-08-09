import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import React from 'react';
import { ActivityIndicator, Animated, Image, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export const CODE_FONT = Platform.select({
    default: 'Courier',
    ios: 'Courier New',
    android: 'monospace',
});
function useFadeIn() {
    // Returns a React Native Animated value for fading in
    const [value] = React.useState(() => new Animated.Value(0));
    React.useEffect(() => {
        Animated.timing(value, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, []);
    return value;
}
export function ToastWrapper({ children }) {
    const inTabBar = React.useContext(BottomTabBarHeightContext);
    const Wrapper = inTabBar ? View : SafeAreaView;
    return (React.createElement(Wrapper, { collapsable: false, style: { flex: 1 } }, children));
}
export function Toast({ children, filename, warning, }) {
    const filenamePretty = React.useMemo(() => {
        if (!filename)
            return undefined;
        return 'app' + filename.replace(/^\./, '');
    }, [filename]);
    const value = useFadeIn();
    return (React.createElement(View, { style: styles.container },
        React.createElement(Animated.View, { style: [
                styles.toast,
                // @ts-expect-error: fixed is supported on web.
                {
                    position: Platform.select({
                        web: 'fixed',
                        default: 'absolute',
                    }),
                    opacity: value,
                },
            ] },
            !warning && React.createElement(ActivityIndicator, { color: "white" }),
            warning && React.createElement(Image, { source: require('expo-router/assets/error.png'), style: styles.icon }),
            React.createElement(View, { style: { marginLeft: 8 } },
                React.createElement(Text, { style: styles.text }, children),
                filenamePretty && React.createElement(Text, { style: styles.filename }, filenamePretty)))));
}
const styles = StyleSheet.create({
    container: {
        backgroundColor: 'transparent',
        flex: 1,
    },
    icon: { width: 20, height: 20, resizeMode: 'contain' },
    toast: {
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        flexDirection: 'row',
        bottom: 8,
        left: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 4,
        backgroundColor: 'black',
    },
    text: { color: 'white', fontSize: 16 },
    filename: {
        fontFamily: CODE_FONT,
        opacity: 0.8,
        color: 'white',
        fontSize: 12,
    },
    code: { fontFamily: CODE_FONT },
});
//# sourceMappingURL=Toast.js.map