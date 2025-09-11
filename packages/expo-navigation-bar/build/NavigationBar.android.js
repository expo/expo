import { useEffect, useState } from 'react';
import { Appearance, processColor } from 'react-native';
import { isEdgeToEdge } from 'react-native-is-edge-to-edge';
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
export async function setBackgroundColorAsync(color) {
    if (isEdgeToEdge()) {
        console.warn('`setBackgroundColorAsync` is not supported with edge-to-edge enabled.');
        return;
    }
    const colorNumber = processColor(color);
    await ExpoNavigationBar.setBackgroundColorAsync(colorNumber);
}
export async function getBackgroundColorAsync() {
    if (isEdgeToEdge()) {
        console.warn('`getBackgroundColorAsync` is not supported with edge-to-edge enabled.');
        return `#00000000`;
    }
    return await ExpoNavigationBar.getBackgroundColorAsync();
}
export async function setBorderColorAsync(color) {
    if (isEdgeToEdge()) {
        console.warn('`setBorderColorAsync` is not supported with edge-to-edge enabled.');
        return;
    }
    const colorNumber = processColor(color);
    await ExpoNavigationBar.setBorderColorAsync(colorNumber);
}
export async function getBorderColorAsync() {
    if (isEdgeToEdge()) {
        console.warn('`getBorderColorAsync` is not supported with edge-to-edge enabled.');
        return `#00000000`;
    }
    return await ExpoNavigationBar.getBorderColorAsync();
}
export async function setVisibilityAsync(visibility) {
    await ExpoNavigationBar.setVisibilityAsync(visibility);
}
export async function getVisibilityAsync() {
    return ExpoNavigationBar.getVisibilityAsync();
}
export async function setButtonStyleAsync(style) {
    await ExpoNavigationBar.setButtonStyleAsync(style);
}
export async function getButtonStyleAsync() {
    if (isEdgeToEdge()) {
        console.warn('`getButtonStyleAsync` is not supported with edge-to-edge enabled.');
        return 'light';
    }
    return await ExpoNavigationBar.getButtonStyleAsync();
}
export async function setPositionAsync(position) {
    if (isEdgeToEdge()) {
        console.warn('`setPositionAsync` is not supported with edge-to-edge enabled.');
        return;
    }
    await ExpoNavigationBar.setPositionAsync(position);
}
export async function unstable_getPositionAsync() {
    if (isEdgeToEdge()) {
        console.warn('`unstable_getPositionAsync` is not supported with edge-to-edge enabled.');
        return 'relative';
    }
    return await ExpoNavigationBar.unstable_getPositionAsync();
}
export async function setBehaviorAsync(behavior) {
    if (isEdgeToEdge()) {
        console.warn('`setBehaviorAsync` is not supported with edge-to-edge enabled.');
        return;
    }
    await ExpoNavigationBar.setBehaviorAsync(behavior);
}
export async function getBehaviorAsync() {
    if (isEdgeToEdge()) {
        console.warn('`getBehaviorAsync` is not supported with edge-to-edge enabled.');
        return 'inset-touch';
    }
    return await ExpoNavigationBar.getBehaviorAsync();
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