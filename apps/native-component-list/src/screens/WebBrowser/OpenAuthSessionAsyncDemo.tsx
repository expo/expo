import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';

import FunctionDemo, { FunctionDescription } from '../../components/FunctionDemo';

const customSchemeRedirectUrl = Linking.createURL('redirect');
// For testing HTTPS universal link callbacks (iOS 17.4+/macOS 14.4+)
const httpsRedirectUrl = 'https://bare-expo.expo.app/auth/callback';

function buildGithubAuthUrl(redirectUrl: string) {
  const params = new URLSearchParams({
    client_id: 'Ov23liQurgEE5GCzBZ1D',
    redirect_uri: redirectUrl,
    scope: 'read:user',
    state: Math.random().toString(36).slice(2),
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

const FUNCTION_DESCRIPTION: FunctionDescription = {
  name: 'openAuthSessionAsync',
  parameters: [
    {
      name: 'url',
      type: 'constant',
      value: 'url',
    },
    {
      name: 'redirectUrl',
      type: 'enum',
      values: [
        { name: 'Custom Scheme', value: customSchemeRedirectUrl },
        { name: 'HTTPS (Universal Link)', value: httpsRedirectUrl },
      ],
    },
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
  actions: [
    {
      name: 'GitHub',
      action: (_: string, redirectUrl: string, options: WebBrowser.WebBrowserOpenOptions) => {
        const url = buildGithubAuthUrl(redirectUrl);
        return WebBrowser.openAuthSessionAsync(url, redirectUrl, options);
      },
    },
  ],
};

export default function OpenAuthSessionAsyncDemo() {
  return <FunctionDemo namespace="WebBrowser" {...FUNCTION_DESCRIPTION} />;
}
