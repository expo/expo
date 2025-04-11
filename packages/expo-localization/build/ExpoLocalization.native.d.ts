import { type EventSubscription } from 'expo-modules-core';
declare const ExpoLocalizationModule: any;
export declare function addLocaleListener(listener: (event?: unknown) => void): EventSubscription;
export declare function addCalendarListener(listener: (event?: unknown) => void): EventSubscription;
export declare function removeSubscription(subscription: EventSubscription): void;
export default ExpoLocalizationModule;
//# sourceMappingURL=ExpoLocalization.native.d.ts.map