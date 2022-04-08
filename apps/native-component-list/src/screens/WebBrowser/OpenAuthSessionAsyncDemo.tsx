import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';

import FunctionDemo, { FunctionDescription } from '../../components/FunctionDemo';

const FUNCTION_DESCRIPTION: FunctionDescription = {
  name: 'openAuthSessionAsync',
  parameters: [
    {
      name: 'url',
      type: 'constant',
      value: 'url',
    },
    { name: 'redirectUrl', type: 'constant', value: Linking.createURL('redirect') },
    {
      name: 'options',
      type: 'object',
      properties: [
        { name: 'createTask', type: 'boolean', initial: true },
        { name: 'preferEphemeralSession', type: 'boolean', platforms: ['ios'], initial: false },
      ],
    },
  ],
  additionalParameters: [{ name: 'shouldPrompt', type: 'boolean', initial: false }],
  actions: (
    _: string,
    redirectUrl: string,
    options: WebBrowser.WebBrowserOpenOptions,
    shouldPrompt: boolean
  ) => {
    const url = `https://fake-auth.netlify.com?state=faker&redirect_uri=${encodeURIComponent(
      redirectUrl
    )}&prompt=${shouldPrompt ? 'consent' : 'none'}`;
    return WebBrowser.openAuthSessionAsync(url, redirectUrl, options);
  },
};

export default function OpenAuthSessionAsyncDemo() {
  return <FunctionDemo namespace="WebBrowser" {...FUNCTION_DESCRIPTION} />;
}
