'use client';

import { useEffect } from 'react';

import { Unmatched } from './Unmatched';
import * as SplashScreen from '../utils/splash';

/**
 * Renders the built-in `+not-found` screen for the root router's outer slot,
 * used when no route in the app matches the URL at all.
 *
 * @hidden
 */
export function RootUnmatched() {
  // https://github.com/expo/expo/issues/47687
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return <Unmatched />;
}
