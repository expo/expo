import React from 'react';
import { LogBox } from 'react-native';

import AnimatedStyleUpdateExample from './AnimatedStyleUpdateExample';
import ChatHeadsExample from './ChatHeadsExample';
import DragAndSnapExample from './DragAndSnapExample';
import LightboxExample from './LightboxExample';
import MeasureExample from './MeasureExample';
import ScrollEventExample from './ScrollEventExample';
import ScrollToExample from './ScrollToExample';
import ScrollableViewExample from './ScrollableViewExample';
import SwipeableListExample from './SwipeableListExample';
import WobbleExample from './WobbleExample';

LogBox.ignoreLogs(['Calling `getNode()`']);

export const SCREENS = {
  AnimatedStyleUpdateExample: {
    screen: AnimatedStyleUpdateExample,
    title: '🆕 Animated Style Update',
  },
  WobbleExample: {
    screen: WobbleExample,
    title: '🆕 Animation Modifiers (Wobble Effect)',
  },
  DragAndSnapExample: {
    screen: DragAndSnapExample,
    title: '🆕 Drag and Snap',
  },
  MeasureExample: {
    screen: MeasureExample,
    title: '🆕 Synchronous Measure',
  },
  ScrollEventExample: {
    screen: ScrollEventExample,
    title: '🆕 Scroll Events',
  },
  ChatHeadsExample: {
    screen: ChatHeadsExample,
    title: '🆕 Chat Heads',
  },
  ScrollableToExample: {
    screen: ScrollToExample,
    title: '🆕 scrollTo',
  },
  SwipeableListExample: {
    screen: SwipeableListExample,
    title: '🆕 (advanced) Swipeable List',
  },
  LightboxExample: {
    screen: LightboxExample,
    title: '🆕 (advanced) Lightbox',
  },
  ScrollableViewExample: {
    screen: ScrollableViewExample,
    title: '🆕 (advanced) ScrollView imitation',
  },
};

const ReanimatedV2Screens = Object.fromEntries(
  Object.entries(SCREENS).map(([screenName, { screen, title }]) => {
    // @ts-ignore
    const screenWithStatics: JSX.Element & { title: string; route: string } = screen;
    screenWithStatics.title = title;
    screenWithStatics.route = `reanimatedv2/${screenName.toLowerCase()}`;
    return [screenName, screenWithStatics];
  })
);

export default ReanimatedV2Screens;
