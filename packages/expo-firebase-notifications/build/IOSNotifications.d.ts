import { Notifications } from './types';
export declare type BackgroundFetchResultValue = string;
declare type BackgroundFetchResult = {
    noData: BackgroundFetchResultValue;
    newData: BackgroundFetchResultValue;
    failure: BackgroundFetchResultValue;
};
export default class IOSNotifications {
    _backgroundFetchResult: BackgroundFetchResult;
    shouldAutoComplete: boolean;
    constructor(notifications: Notifications);
    readonly backgroundFetchResult: BackgroundFetchResult;
}
export {};
