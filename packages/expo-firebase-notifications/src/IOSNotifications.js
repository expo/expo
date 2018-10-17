// @flow
// import type Notifications from '.';
type Notifications = Object;
export type BackgroundFetchResultValue = string;
type BackgroundFetchResult = {
  noData: BackgroundFetchResultValue,
  newData: BackgroundFetchResultValue,
  failure: BackgroundFetchResultValue,
};

export default class IOSNotifications {
  _backgroundFetchResult: BackgroundFetchResult;

  shouldAutoComplete: boolean;

  constructor(notifications: Notifications) {
    this.shouldAutoComplete = true;

    const { nativeModule } = notifications;
    this._backgroundFetchResult = {
      noData: nativeModule.backgroundFetchResultNoData,
      newData: nativeModule.backgroundFetchResultNewData,
      failure: nativeModule.backgroundFetchResultFailure,
    };
  }

  get backgroundFetchResult(): BackgroundFetchResult {
    return { ...this._backgroundFetchResult };
  }
}
