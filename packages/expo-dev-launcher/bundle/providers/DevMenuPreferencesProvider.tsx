import * as React from 'react';

import {
  DevMenuPreferencesType,
  getMenuPreferencesAsync,
  setMenuPreferencesAsync,
} from '../native-modules/DevMenuPreferences';

export type DevMenuPreferencesContext = {
  motionGestureEnabled: boolean;
  setMotionGestureEnabled: (enabled: boolean) => void;
  touchGestureEnabled: boolean;
  setTouchGestureEnabled: (enabled: boolean) => void;
  showsAtLaunch: boolean;
  setShowsAtLaunch: (enabled: boolean) => void;
};

const Context = React.createContext<DevMenuPreferencesContext | null>(null);
export const useDevMenuPreferences = () => React.useContext(Context);

type DevMenuPreferencesProviderProps = {
  children: React.ReactNode;
  initialPreferences?: DevMenuPreferencesType;
};

export function DevMenuPreferencesProvider({
  children,
  initialPreferences,
}: DevMenuPreferencesProviderProps) {
  const [motionGestureEnabled, setMotionGestureEnabled] = React.useState(
    initialPreferences?.motionGestureEnabled
  );
  const [touchGestureEnabled, setTouchGestureEnabled] = React.useState(
    initialPreferences?.touchGestureEnabled
  );
  const [showsAtLaunch, setShowsAtLaunch] = React.useState(initialPreferences?.showsAtLaunch);

  React.useEffect(() => {
    getMenuPreferencesAsync().then((settings) => {
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
    setMenuPreferencesAsync({
      showsAtLaunch: enabled,
    }).catch(() => {
      // restore to previous value in case of error
      setShowsAtLaunch(showsAtLaunch);
    });

    setShowsAtLaunch(enabled);
  };

  const onMotionGestureChange = (enabled: boolean) => {
    setMenuPreferencesAsync({
      motionGestureEnabled: enabled,
    }).catch(() => {
      // restore to previous value in case of error
      setMotionGestureEnabled(motionGestureEnabled);
    });

    setMotionGestureEnabled(enabled);
  };

  const onTouchGestureChange = (enabled: boolean) => {
    setMenuPreferencesAsync({
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
