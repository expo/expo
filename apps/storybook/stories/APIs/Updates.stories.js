import React from 'react';
import { View } from 'react-native';

import { AppText, Code, DocItem, Section, TextList } from '../ui-explorer';

export const title = 'Updates';
export const label = 'Updates';

export const packageJson = require('expo/package.json');
export const description =
  'API for controlling and responding to over-the-air updates to your app.';
export const component = () => (
  <View>
    <Section title="Methods">
      <DocItem
        name="reload()"
        description="Immediately reloads the current experience. This will use your app.json `updates` configuration to fetch and load the newest available JS supported by the device's Expo environment. This is useful for triggering an update of your experience if you have published a new version."
      />
      <DocItem
        name="reloadFromCache()"
        description="Immediately reloads the current experience using the most recent cached version. This is useful for triggering an update of your experience if you have published and already downloaded a new version."
      />
      <DocItem
        name="checkForUpdateAsync()"
        typeInfo="Promise<{ isAvailable: boolean, manifest: Object }>"
        description="Check if a new published version of your project is available. Does not actually download the update. Rejects if `updates.enabled` is `false` in app.json."
      />
      <DocItem
        name="fetchUpdateAsync(params?)"
        description="Downloads the most recent published version of your experience to the device's local cache. Rejects if `updates.enabled` is `false` in app.json."
      />
      <DocItem
        name="addListener(eventListener)"
        description="Invokes a callback when updates-related events occur, either on the initial app load or as a result of a call to `Updates.fetchUpdateAsync`."
      />
    </Section>
    <Section title="Related types">
      <DocItem
        name="Event"
        description={[
          <AppText>
            An object that is passed into each event listener when a new version is available.
          </AppText>,
          <TextList
            items={[
              <AppText>
                <Code>type (_string_)</Code>: -- Type of the event
              </AppText>,
              <AppText>
                <Code>manifest (_object_)</Code>: -- If `type ===
                Updates.EventType.DOWNLOAD_FINISHED`, the manifest of the newly downloaded update.
                Undefined otherwise.
              </AppText>,
              <AppText>
                <Code>message (_string_)</Code>: -- If `type === Updates.EventType.ERROR`, the error
                message. Undefined otherwise.
              </AppText>,
            ]}
          />,
        ]}
      />
    </Section>
  </View>
);
