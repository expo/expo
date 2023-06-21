import { A, B } from '@expo/html-elements';
import * as AuthSession from 'expo-auth-session';
import React from 'react';
import { Text, View } from 'react-native';

import AuthCard from './AuthCard';

export function AuthResult({ result }: any) {
  if (!result) {
    return null;
  }
  return (
    <View>
      {Object.keys(result).map((key) => {
        const value = result[key];
        if (['_', '#', ''].includes(key)) return null;

        return <KVText key={key} k={key} v={value} />;
      })}
    </View>
  );
}

export function AuthSection({
  title,
  request,
  result,
  tokenResponse,
  promptAsync,
  disabled,
}: {
  title: string;
  request: null | AuthSession.AuthRequest;
  result: null | AuthSession.AuthSessionResult;
  tokenResponse?: null | AuthSession.TokenResponse;
  promptAsync: (
    options?: AuthSession.AuthRequestPromptOptions
  ) => Promise<AuthSession.AuthSessionResult>;
  disabled?: boolean;
}) {
  // @ts-ignore
  const params = result?.params;

  return (
    <View style={{ paddingBottom: 8 }}>
      <AuthCard
        name={title}
        disabled={disabled}
        status={result?.type}
        url={request?.url}
        onPress={(color) =>
          promptAsync({
            // Tint the controller
            toolbarColor: color,
            // iOS -- unused, possibly should remove the types
            controlsColor: color,
            secondaryToolbarColor: color,
          })
        }
      />
      <View style={{ padding: 8 }}>
        <KVText
          href={request?.redirectUri}
          k="Redirect URL"
          v={request?.redirectUri || 'Loading...'}
        />
        <AuthResult result={params} />
        <AuthResult result={tokenResponse} />
      </View>
    </View>
  );
}

export function KVText({ k, v, href, ...props }: any) {
  if (href) {
    return (
      <A {...props} style={{ color: '#709CCF' }} numberOfLines={2}>
        <B style={{ color: '#999' }}>{k}</B> {v}
      </A>
    );
  }
  return (
    <Text {...props} style={{ color: '#999' }} numberOfLines={2}>
      <Text>{k}: </Text>
      {JSON.stringify(v, null, '\t')}
    </Text>
  );
}
