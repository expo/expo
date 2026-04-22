import { BackHandler } from 'react-native';
export const addCancelListener = (callback) => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', callback);
    return () => {
        subscription.remove();
    };
};
//# sourceMappingURL=addCancelListener.native.js.map