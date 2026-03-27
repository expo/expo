import { useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import ExpoNavigationBar from './ExpoNavigationBar';
function isLightColorScheme() {
    const colorScheme = Appearance?.getColorScheme() ?? 'light';
    return colorScheme === 'light';
}
function navigationBarStyleToButtonStyle(navigationBarStyle) {
    switch (navigationBarStyle) {
        case 'auto':
            return isLightColorScheme() ? 'dark' : 'light';
        case 'light':
            return 'dark';
        case 'dark':
            return 'light';
        case 'inverted':
            return isLightColorScheme() ? 'light' : 'dark';
    }
}
export function addVisibilityListener(listener) {
    return ExpoNavigationBar.addListener('ExpoNavigationBar.didChange', listener);
}
export async function setVisibilityAsync(visibility) {
    await ExpoNavigationBar.setVisibilityAsync(visibility);
}
export async function getVisibilityAsync() {
    return ExpoNavigationBar.getVisibilityAsync();
}
export function setStyle(style) {
    ExpoNavigationBar.setButtonStyleAsync(navigationBarStyleToButtonStyle(style));
}
export function useVisibility() {
    const [visibility, setVisible] = useState(null);
    useEffect(() => {
        let isMounted = true;
        getVisibilityAsync().then((visibility) => {
            if (isMounted) {
                setVisible(visibility);
            }
        });
        const listener = addVisibilityListener(({ visibility }) => {
            if (isMounted) {
                setVisible(visibility);
            }
        });
        return () => {
            listener.remove();
            isMounted = false;
        };
    }, []);
    return visibility;
}
//# sourceMappingURL=NavigationBar.android.js.map