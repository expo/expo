import { ComponentType, DependencyList } from 'react';
import { ViewProps } from 'react-native';
type PropsAdapterFunction = (props: Record<string, unknown>) => void;
type Reanimated = {
    default: {
        createAnimatedComponent<P extends object>(component: ComponentType<P>, options?: unknown): ComponentType<P>;
        View: ComponentType<ViewProps>;
    };
    useAnimatedProps<T extends object>(updater: () => Partial<T>, deps?: DependencyList | null, adapters?: PropsAdapterFunction | PropsAdapterFunction[] | null): Partial<T>;
    useAnimatedStyle<T>(updater: () => T, deps?: DependencyList | null): T;
} | undefined;
export default function getReanimatedIfAvailable(): Reanimated;
export {};
//# sourceMappingURL=getReanimatedIfAvailable.d.ts.map