import * as WebBrowser from 'expo-web-browser';
import React from 'react';

import FunctionDemo, { FunctionDescription } from '../../components/FunctionDemo';
import Colors from '../../constants/Colors';

const URL = 'https://blog.expo.dev/expo-sdk-44-4c4b8306584a';

const FUNCTIONS_DESCRIPTION: FunctionDescription = {
  name: 'openBrowserAsync',
  parameters: [
    {
      type: 'constant',
      name: 'url',
      value: URL,
    },
    {
      type: 'object',
      name: 'options',
      properties: [
        {
          name: 'toolbarColor',
          type: 'enum',
          values: [
            {
              name: 'undefined',
              value: undefined,
            },
            {
              name: `"${Colors.tintColor}"`,
              value: Colors.tintColor,
            },
          ],
        },
        {
          name: 'secondaryToolbarColor',
          platforms: ['android'],
          type: 'enum',
          values: [
            {
              name: 'undefined',
              value: undefined,
            },
            {
              name: `"${Colors.highlightColor}"`,
              value: Colors.highlightColor,
            },
          ],
        },
        {
          name: 'controlsColor',
          type: 'enum',
          values: [
            {
              name: 'undefined',
              value: undefined,
            },
            { name: `"${Colors.headerTitle}"`, value: Colors.headerTitle },
          ],
        },
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
        {
          name: 'presentationStyle',
          type: 'enum',
          platforms: ['ios'],
          values: [
            {
              name: 'WebBrowserPresentationStyle.FullScreen',
              value: WebBrowser.WebBrowserPresentationStyle.FullScreen,
            },
            {
              name: 'WebBrowserPresentationStyle.PageSheet',
              value: WebBrowser.WebBrowserPresentationStyle.PageSheet,
            },
            {
              name: 'WebBrowserPresentationStyle.FormSheet',
              value: WebBrowser.WebBrowserPresentationStyle.FormSheet,
            },
            {
              name: 'WebBrowserPresentationStyle.CurrentContext',
              value: WebBrowser.WebBrowserPresentationStyle.CurrentContext,
            },
            {
              name: 'WebBrowserPresentationStyle.OverFullScreen',
              value: WebBrowser.WebBrowserPresentationStyle.OverFullScreen,
            },
            {
              name: 'WebBrowserPresentationStyle.OverCurrentContext',
              value: WebBrowser.WebBrowserPresentationStyle.OverCurrentContext,
            },
            {
              name: 'WebBrowserPresentationStyle.Popover',
              value: WebBrowser.WebBrowserPresentationStyle.Popover,
            },
            {
              name: 'WebBrowserPresentationStyle.Automatic',
              value: WebBrowser.WebBrowserPresentationStyle.Automatic,
            },
          ],
        },
      ],
    },
  ],
  actions: [
    { name: 'Open', action: WebBrowser.openBrowserAsync },
    {
      name: 'Open and dismiss',
      action: async (url: string, openOptions: WebBrowser.WebBrowserOpenOptions) => {
        await WebBrowser.openBrowserAsync(url, openOptions);
        return WebBrowser.dismissBrowser();
      },
    },
    {
      name: 'Open twice',
      action: (url: string, openOptions: WebBrowser.WebBrowserOpenOptions) => {
        WebBrowser.openBrowserAsync(url, openOptions);
        return WebBrowser.openBrowserAsync(url, openOptions);
      },
    },
    { name: 'Dismiss (no-op)', action: async () => WebBrowser.dismissBrowser() },
  ],
};

export default function OpenBrowserAsyncDemo() {
  return <FunctionDemo namespace="WebBrowser" {...FUNCTIONS_DESCRIPTION} />;
}
