import { Easing } from 'react-native';
export const FadeSpec = {
    animation: 'timing',
    config: {
        duration: 150,
        easing: Easing.in(Easing.linear),
    },
};
export const ShiftSpec = {
    animation: 'timing',
    config: {
        duration: 150,
        easing: Easing.inOut(Easing.ease),
    },
};
//# sourceMappingURL=TransitionSpecs.js.map