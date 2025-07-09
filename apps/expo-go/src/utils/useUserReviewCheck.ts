import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as StoreReview from 'expo-store-review';
import { useEffect, useState } from 'react';
import { Platform, AppState, NativeEventSubscription } from 'react-native';

import addListenerWithNativeCallback from './addListenerWithNativeCallback';
import { CommonAppDataFragment, CommonSnackDataFragment } from '../graphql/types';
import * as Kernel from '../kernel/Kernel';
import { HomeStackRoutes } from '../navigation/Navigation.types';

export function listenForForegroundEvent(
  listener: (event: any) => Promise<any>
): NativeEventSubscription {
  if (Platform.OS === 'ios') {
    /**
     * On iOS the launcher is always rendered, even when opening projects
     * the launcher keeps running in a View in the background. Because of that
     * we need a native event to be able detect when the "home" is in the foreground.
     */
    return addListenerWithNativeCallback('ExponentKernel.foregroundHome', listener);
  }

  /**
   * On Android we use different activities for the launcher and projects,
   * that way we can detect when the app is in the foreground by listening
   * to AppState changes.
   */
  return AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      listener(state);
    }
  });
}

type UserReviewInfo = {
  askedForNativeReviewDate?: Date;
  lastDismissDate?: Date;
  showFeedbackFormDate?: Date;
  appOpenedCounter: number;
};

const userReviewInfoDefaultValues: UserReviewInfo = {
  askedForNativeReviewDate: undefined,
  lastDismissDate: undefined,
  appOpenedCounter: 0,
};

type UseUserReviewCheckParams = {
  apps?: CommonAppDataFragment[];
  snacks?: CommonSnackDataFragment[];
};

export const useUserReviewCheck = ({ apps, snacks }: UseUserReviewCheckParams) => {
  const [lastCrashDate, setLastCrashDate] = useState<Date>();
  const [userReviewInfo, setUserReviewInfo] = useState<UserReviewInfo>();
  const [isStoreReviewAvailable, setIsStoreReviewAvailable] = useState<boolean>();

  const navigation = useNavigation<StackNavigationProp<HomeStackRoutes>>();

  const timeNow = new Date();
  const noRecentCrashes = lastCrashDate
    ? timeNow.getTime() - new Date(lastCrashDate).getTime() > 60 * 60 * 1000
    : true;
  const noRecentDismisses = userReviewInfo?.lastDismissDate
    ? timeNow.getTime() - userReviewInfo?.lastDismissDate.getTime() > 15 * 24 * 60 * 60 * 1000
    : true;

  /**
   * We should only prompt users to review the app if they seem to be
   * having a good experience, to check that we verify if the user
   * has not experienced any crashes in the last hour, and has at least
   * 5 apps or 5 snacks or has opened the app at least 50 times.
   * If the user dismisses the review section, we only show it again
   * after 15 days.
   */
  const shouldShowReviewSection =
    isStoreReviewAvailable &&
    userReviewInfo &&
    !userReviewInfo?.askedForNativeReviewDate &&
    !userReviewInfo?.showFeedbackFormDate &&
    noRecentCrashes &&
    noRecentDismisses &&
    (userReviewInfo.appOpenedCounter >= 50 ||
      (apps?.length || 0) >= 5 ||
      (snacks?.length || 0) >= 5);

  function updateUserReviewInfo(info: Partial<UserReviewInfo>) {
    const newInfo: UserReviewInfo = { ...userReviewInfoDefaultValues, ...userReviewInfo, ...info };
    AsyncStorage.setItem('userReviewInfo', JSON.stringify(newInfo));
    setUserReviewInfo(newInfo);
  }

  useEffect(() => {
    StoreReview.isAvailableAsync().then(setIsStoreReviewAvailable);
    AsyncStorage.getItem('userReviewInfo').then((info) => {
      const userReviewInfo: UserReviewInfo = info
        ? JSON.parse(info, (key, value) => {
            // Convert string representations back to Date objects
            if (key.endsWith('Date') && typeof value === 'string') {
              return new Date(value);
            }
            return value;
          })
        : {};
      userReviewInfo.appOpenedCounter = Number(userReviewInfo.appOpenedCounter || 0) + 1;
      updateUserReviewInfo(userReviewInfo);
    });
  }, []);

  useEffect(() => {
    const getLastCrashDate = async () => {
      const lastCrash = await Kernel.getLastCrashDate();
      setLastCrashDate(lastCrash ? new Date(lastCrash) : undefined);
    };
    const listener = listenForForegroundEvent(getLastCrashDate);

    getLastCrashDate();

    return listener.remove;
  }, []);

  function requestStoreReview() {
    updateUserReviewInfo({ askedForNativeReviewDate: new Date() });
    StoreReview.requestReview();
  }

  function dismissReviewSection() {
    updateUserReviewInfo({ lastDismissDate: new Date() });
  }

  function provideFeedback() {
    updateUserReviewInfo({ showFeedbackFormDate: new Date() });
    navigation.navigate('FeedbackForm');
  }

  return {
    shouldShowReviewSection,
    dismissReviewSection,
    requestStoreReview,
    provideFeedback,
  };
};
