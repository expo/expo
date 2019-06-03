import React from 'react';

import { DocItem, Section } from '../ui-explorer';

const api = [
  {
    name: 'Constants.appOwnership',
    description: `Returns expo, standalone, or guest. If expo, the experience is running inside of the Expo client. If standalone, it is a standalone app. If guest, it has been opened through a link from a standalone app.`,
    typeInfo: "'standalone' | 'expo' | 'guest'",
  },
  {
    name: 'Constants.expoVersion',
    description: `The version string of the Expo client currently running.`,
    typeInfo: 'string',
  },
  {
    name: 'Constants.installationId',
    description: `An identifier that is unique to this particular device and installation of the Expo client.`,
    typeInfo: 'string',
  },
  {
    name: 'Constants.deviceName',
    description: `A human-readable name for the device type.`,
    typeInfo: 'string',
  },
  {
    name: 'Constants.deviceYearClass',
    description: `The device year class of this device.`,
    typeInfo: 'string',
  },
  {
    name: 'Constants.getWebViewUserAgentAsync()',
    description: `Gets the user agent string which would be included in requests sent by a web view running on this device. This is probably not the same user agent you might be providing in your JS fetch requests.`,
    typeInfo: 'Promise<string>',
  },
  {
    name: 'Constants.isDevice',
    description: `true if the app is running on a device, false if running in a simulator or emulator.`,
    typeInfo: 'boolean',
  },
  {
    name: 'Constants.sessionId',
    description: `A string that is unique to the current session of your app. It is different across apps and across multiple launches of the same app.`,
    typeInfo: 'string',
  },
  {
    name: 'Constants.statusBarHeight',
    description: `The default status bar height for the device. Does not factor in changes when location tracking is in use or a phone call is active.`,
    typeInfo: 'number',
  },
  {
    name: 'Constants.systemFonts',
    description: `A list of the system font names available on the current device.`,
    typeInfo: 'string[]',
  },
  {
    name: 'Constants.manifest',
    description: `The manifest object for the app.`,
    typeInfo: 'Object',
  },
];

export const title = 'Constants';
export const packageJson = require('expo-constants/package.json');
export const description =
  'System information that remains constant throughout the lifetime of your app.';
export const component = () => (
  <Section title="API">
    <DocItem
      name="Importing the module"
      example={{
        code: `import Constants from 'expo-constants';`,
      }}
    />

    {api.map((props, index) => (
      <DocItem key={index} {...props} />
    ))}
  </Section>
);
