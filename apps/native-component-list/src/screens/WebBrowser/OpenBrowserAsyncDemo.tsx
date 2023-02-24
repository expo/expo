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
            {
              name: '"pink"',
              value: 'pink',
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
            {
              name: '"blue"',
              value: 'blue',
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
            {
              name: '"red"',
              value: 'red',
            },
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
              name: 'WebBrowserPresentationStyle.OVER_FULL_SCREEN',
              value: WebBrowser.WebBrowserPresentationStyle.OVER_FULL_SCREEN,
            },
            {
              name: 'WebBrowserPresentationStyle.FULL_SCREEN',
              value: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
            },
            {
              name: 'WebBrowserPresentationStyle.PAGE_SHEET',
              value: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
            },
            {
              name: 'WebBrowserPresentationStyle.FORM_SHEET',
              value: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
            },
            {
              name: 'WebBrowserPresentationStyle.CURRENT_CONTEXT',
              value: WebBrowser.WebBrowserPresentationStyle.CURRENT_CONTEXT,
            },
            {
              name: 'WebBrowserPresentationStyle.OVER_CURRENT_CONTEXT',
              value: WebBrowser.WebBrowserPresentationStyle.OVER_CURRENT_CONTEXT,
            },
            {
              name: 'WebBrowserPresentationStyle.POPOVER',
              value: WebBrowser.WebBrowserPresentationStyle.POPOVER,
            },
            {
              name: 'WebBrowserPresentationStyle.AUTOMATIC',
              value: WebBrowser.WebBrowserPresentationStyle.AUTOMATIC,
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
      action: (url: string, openOptions: WebBrowser.WebBrowserOpenOptions) => {
        const openBrowserPromise = WebBrowser.openBrowserAsync(url, openOptions);
        WebBrowser.dismissBrowser();
        return openBrowserPromise;
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
