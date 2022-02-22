import * as WebBrowser from 'expo-web-browser';
import React from 'react';

import FunctionDemo from '../../components/FunctionDemo';

const URL = 'https://blog.expo.dev/expo-sdk-44-4c4b8306584a';

export default function OpenBrowserAsyncDemo() {
  const openBrowser = async (url: string, openOptions: WebBrowser.WebBrowserOpenOptions) =>
    WebBrowser.openBrowserAsync(url, openOptions);
  const dismissBrowser = async () => WebBrowser.dismissBrowser();
  const openAndDismiss = async (url: string, openOptions: WebBrowser.WebBrowserOpenOptions) => {
    await WebBrowser.openBrowserAsync(url, openOptions);
    return WebBrowser.dismissBrowser();
  };
  const openTwice = async (url: string, openOptions: WebBrowser.WebBrowserOpenOptions) => {
    WebBrowser.openBrowserAsync(url, openOptions);
    return WebBrowser.openBrowserAsync(url, openOptions);
  };

  return (
    <FunctionDemo
      namespace="WebBrowser"
      name="openBrowserAsync"
      parameters={[
        {
          type: 'constant',
          name: 'url',
          value: URL,
        },
        {
          type: 'object',
          name: 'options',
          properties: [
            // {
            //   name: 'toolbarColor',
            //   title: `Use toolbarColor (${Colors.tintColor})`,
            //   initial: false,
            //   resolve: (checked) => (checked ? Colors.tintColor : undefined),
            // },
            // {
            //   name: 'secondaryToolbarColor',
            //   title: `Use secondaryToolbarColor (${Colors.highlightColor})`,
            //   platforms: ['android'],
            //   initial: false,
            //   resolve: (checked) => (checked ? Colors.highlightColor : undefined),
            // },
            // {
            //   name: 'controlsColor',
            //   title: `Use controlsColor (${Colors.headerTitle})`,
            //   initial: false,
            //   resolve: (checked) => (checked ? Colors.headerTitle : undefined),
            // },
            {
              type: 'boolean',
              name: 'showTitle',
              platforms: ['android'],
              initial: false,
            },
            {
              type: 'boolean',
              name: 'showInRecents',
              platforms: ['android'],
              initial: false,
            },
            {
              type: 'boolean',
              name: 'enableBarCollapsing',
              initial: false,
            },
            {
              type: 'boolean',
              name: 'readerMode',
              platforms: ['ios'],
              initial: false,
            },
            {
              type: 'boolean',
              name: 'enableDefaultShareMenuItem',
              platforms: ['android'],
              initial: false,
            },
          ],
        },
      ]}
      actions={[
        { name: 'Open', action: openBrowser },
        { name: 'Open and dismiss', action: openAndDismiss },
        { name: 'Open twice', action: openTwice },
        { name: 'Dismiss (no-op)', action: dismissBrowser },
      ]}
    />
  );
}
