import { type EventSubscription } from 'expo-modules-core';
import { Calendar, Locale } from './Localization.types';
export declare function addLocaleListener(listener: (event?: unknown) => void): EventSubscription;
export declare function addCalendarListener(listener: (event?: unknown) => void): EventSubscription;
export declare function removeSubscription(subscription: EventSubscription): void;
declare const _default: {
    getLocales(): [Locale, ...Locale[]];
    getCalendars(): [Calendar, ...Calendar[]];
};
export default _default;
//# sourceMappingURL=ExpoLocalization.d.ts.map