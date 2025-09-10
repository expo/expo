import { SplitView } from 'expo-router';
import React from 'react';

export default function Layout() {
  return (
    <SplitView
      preferredDisplayMode="automatic"
      preferredSplitBehavior="tile"
      showSecondaryToggleButton
    />
  );
}
