import * as React from 'react';

import { ImageComparisonBody } from './ImageComparisonScreen';
import AppearanceTests from './tests/appearance';

/**
 * Dedicated screen for the expo-image e2e viewshot flow. It renders only the section
 * the flow screenshots, so the screen mounts fast and the view hierarchy settles
 * immediately, while the full comparison screen mounts a large list that keeps
 * mutating for a long time and stalls Maestro's settle wait after opening the link.
 */
export default function ImageComparisonE2EScreen() {
  return (
    <ImageComparisonBody sections={[{ title: AppearanceTests.name, data: AppearanceTests.tests }]} />
  );
}
