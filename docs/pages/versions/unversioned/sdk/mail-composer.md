---
title: MailComposer
sourceCodeUrl: 'https://github.com/expo/expo/tree/main/packages/expo-mail-composer'
packageName: 'expo-mail-composer'
---

import APISection from '~/components/plugins/APISection';
import {APIInstallSection} from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import Video from '~/components/plugins/Video';

**`expo-mail-composer`** allows you to compose and send emails quickly and easily using the OS UI. This module can't be used on iOS Simulators since you can't sign into a mail account on them.

<Video file={"sdk/mailcomposer.mp4"} loop={false} />

<PlatformsSection android emulator ios web />

## Installation

<APIInstallSection />

## API

```js
import * as MailComposer from 'expo-mail-composer';
```

<APISection packageName="expo-mail-composer" apiName="MailComposer" />
