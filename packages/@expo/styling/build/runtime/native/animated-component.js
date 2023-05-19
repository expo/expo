import { View, Text, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
const animatedCache = new WeakMap([
    [View, Animated.View],
    [Animated.View, Animated.View],
    [Text, Animated.Text],
    [Animated.Text, Animated.Text],
    [Text, Animated.Text],
    [Pressable, Animated.createAnimatedComponent(Pressable)],
]);
export function createAnimatedComponent(Component) {
    if (animatedCache.has(Component)) {
        return animatedCache.get(Component);
    }
    else if (Component.displayName?.startsWith('AnimatedComponent')) {
        return Component;
    }
    if (!(typeof Component !== 'function' ||
        (Component.prototype && Component.prototype.isReactComponent))) {
        throw new Error(`Looks like you're passing an animation style to a function component \`${Component.name}\`. Please wrap your function component with \`React.forwardRef()\` or use a class component instead.`);
    }
    const AnimatedComponent = Animated.createAnimatedComponent(Component);
    animatedCache.set(Component, AnimatedComponent);
    return AnimatedComponent;
}
//# sourceMappingURL=animated-component.js.map