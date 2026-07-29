---
title: LoadingIndicator
description: Jetpack Compose loading indicator components for displaying loading state.
sourceCodeUrl: 'https://github.com/expo/expo/tree/main/packages/expo-ui'
packageName: '@expo/ui'
platforms: ['android', 'expo-go']
---

import APISection from '~/components/plugins/APISection';
import { APIInstallSection } from '~/components/plugins/InstallSection';
import { ContentSpotlight } from '~/ui/components/ContentSpotlight';

Expo UI Loading Indicators match the official Jetpack Compose [Loading Indicator API](https://m3.material.io/components/loading-indicator/overview).

<ContentSpotlight
  variant="component"
  aspect="landscape"
  src="/static/images/expo-ui/loadingindicator/android-light.webp"
  darkSrc="/static/images/expo-ui/loadingindicator/android-dark.webp"
  alt="Default and contained loading indicators in indeterminate mode"
/>

## Installation

<APIInstallSection />

## Usage

### Loading indicator

A morphing-shape loading animation from Material 3 Expressive.

```tsx LoadingIndicatorExample.tsx
import { Host, LoadingIndicator } from '@expo/ui/jetpack-compose';

export default function LoadingIndicatorExample() {
  return (
    <Host matchContents>
      <LoadingIndicator />
    </Host>
  );
}
```

### Contained loading indicator

A loading indicator inside a colored background.

```tsx ContainedLoadingIndicatorExample.tsx
import { Host, ContainedLoadingIndicator } from '@expo/ui/jetpack-compose';

export default function ContainedLoadingIndicatorExample() {
  return (
    <Host matchContents>
      <ContainedLoadingIndicator />
    </Host>
  );
}
```

### Indeterminate

Omit the `progress` prop to animate continuously without indicating a specific completion level.

```tsx IndeterminateExample.tsx
import { ContainedLoadingIndicator, Host, LoadingIndicator, Row } from '@expo/ui/jetpack-compose';

export default function IndeterminateExample() {
  return (
    <Host matchContents>
      <Row horizontalArrangement={{ spacedBy: 16 }}>
        <LoadingIndicator />
        <ContainedLoadingIndicator />
      </Row>
    </Host>
  );
}
```

### Determinate

Pass an observable state from `useNativeState` as `progress`. Update `progress.value` between `0` and `1`.

```tsx DeterminateExample.tsx
import {
  ContainedLoadingIndicator,
  Host,
  LoadingIndicator,
  Row,
  useNativeState,
} from '@expo/ui/jetpack-compose';
import { useEffect } from 'react';

export default function DeterminateExample() {
  const progress = useNativeState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      progress.value = (progress.value + 0.05) % 1;
    }, 500);
    return () => clearInterval(interval);
  }, [progress]);

  return (
    <Host matchContents>
      <Row horizontalArrangement={{ spacedBy: 16 }}>
        <LoadingIndicator progress={progress} />
        <ContainedLoadingIndicator progress={progress} />
      </Row>
    </Host>
  );
}
```

## API

```tsx
import { LoadingIndicator, ContainedLoadingIndicator } from '@expo/ui/jetpack-compose';
```

<APISection packageName="expo-ui/jetpack-compose/loadingindicator" />
