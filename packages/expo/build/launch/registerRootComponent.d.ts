import 'expo/build/Expo.fx';
import * as React from 'react';
import { InitialProps } from './withExpoRoot.types';
export default function registerRootComponent<P extends InitialProps>(component: React.ComponentType<P>): void;
