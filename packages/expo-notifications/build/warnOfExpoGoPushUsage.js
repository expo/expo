import { isRunningInExpoGo } from 'expo';
let didWarn = false;
export const warnOfExpoGoPushUsage = () => {
    if (__DEV__ && isRunningInExpoGo() && !didWarn) {
        didWarn = true;
        console.warn(`expo-notifications: Push notifications (remote notifications) functionality provided by expo-notifications will be removed from Expo Go in SDK 53. Instead, use a development build. Read more at https://docs.expo.dev/develop/development-builds/introduction/.`);
    }
};
//# sourceMappingURL=warnOfExpoGoPushUsage.js.map