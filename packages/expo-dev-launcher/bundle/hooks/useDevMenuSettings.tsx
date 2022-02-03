import * as React from 'react';

import {
  DevMenuSettingsType,
  getSettingsAsync,
  setSettingsAsync,
} from '../native-modules/DevMenuInternal';

export type DevMenuSettingsContext = {
  motionGestureEnabled: boolean;
  setMotionGestureEnabled: (enabled: boolean) => void;
  touchGestureEnabled: boolean;
  setTouchGestureEnabled: (enabled: boolean) => void;
  showsAtLaunch: boolean;
  setShowsAtLaunch: (enabled: boolean) => void;
};

const Context = React.createContext<DevMenuSettingsContext | null>(null);
export const useDevMenuSettings = () => React.useContext(Context);

type DevMenuSettingsProviderProps = {
  children: React.ReactNode;
  initialSettings?: DevMenuSettingsType;
};

export function DevMenuSettingsProvider({
  children,
  initialSettings,
}: DevMenuSettingsProviderProps) {
  const [motionGestureEnabled, setMotionGestureEnabled] = React.useState(
    initialSettings?.motionGestureEnabled
  );
  const [touchGestureEnabled, setTouchGestureEnabled] = React.useState(
    initialSettings?.touchGestureEnabled
  );
  const [showsAtLaunch, setShowsAtLaunch] = React.useState(initialSettings?.showsAtLaunch);

  React.useEffect(() => {
    getSettingsAsync().then((settings) => {
      if (settings.motionGestureEnabled) {
        setMotionGestureEnabled(true);
      }

      if (settings.touchGestureEnabled) {
        setTouchGestureEnabled(true);
      }

      if (settings.showsAtLaunch) {
        setShowsAtLaunch(true);
      }
    });
  }, []);

  const onShowsAtLaunchChange = (enabled: boolean) => {
    setSettingsAsync({
      showsAtLaunch: enabled,
    }).catch(() => {
      // restore to previous value in case of error
      setShowsAtLaunch(showsAtLaunch);
    });

    setShowsAtLaunch(enabled);
  };

  const onMotionGestureChange = (enabled: boolean) => {
    setSettingsAsync({
      motionGestureEnabled: enabled,
    }).catch(() => {
      // restore to previous value in case of error
      setMotionGestureEnabled(motionGestureEnabled);
    });

    setMotionGestureEnabled(enabled);
  };

  const onTouchGestureChange = (enabled: boolean) => {
    setSettingsAsync({
      touchGestureEnabled: enabled,
    }).catch(() => {
      // restore to previous value in case of error
      setTouchGestureEnabled(touchGestureEnabled);
    });

    setTouchGestureEnabled(enabled);
  };

  return (
    <Context.Provider
      value={{
        motionGestureEnabled,
        setMotionGestureEnabled: onMotionGestureChange,
        touchGestureEnabled,
        setTouchGestureEnabled: onTouchGestureChange,
        showsAtLaunch,
        setShowsAtLaunch: onShowsAtLaunchChange,
      }}>
      {children}
    </Context.Provider>
  );
}
