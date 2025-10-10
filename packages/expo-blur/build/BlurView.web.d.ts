import { View } from 'react-native';
import { BlurViewProps } from './BlurView.types';
declare const BlurView: import("react").ForwardRefExoticComponent<{
    blurTarget?: import("react").RefObject<View | null>;
    tint?: import("./BlurView.types").BlurTint;
    intensity?: number;
    blurReductionFactor?: number;
    experimentalBlurMethod?: import("./BlurView.types").ExperimentalBlurMethod;
} & import("react-native").ViewProps & import("react").RefAttributes<{
    setNativeProps: (props: BlurViewProps) => void;
}>>;
export default BlurView;
//# sourceMappingURL=BlurView.web.d.ts.map