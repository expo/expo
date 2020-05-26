import { A, B } from '@expo/html-elements';
import React from 'react';
import { Text, View } from 'react-native';

import AuthCard from './AuthCard';

export function AuthResult({ result }: any) {
  if (!result) {
    return null;
  }
  return (
    <View>
      {Object.keys(result).map(key => {
        const value = result[key];
        if (['_', '#', ''].includes(key)) return null;

        return <KVText key={key} k={key} v={value} />;
      })}
    </View>
  );
}

export function AuthSection({ title, request, result, promptAsync, useProxy, disabled }: any) {
  return (
    <View style={{ paddingBottom: 8 }}>
      <AuthCard
        name={title}
        disabled={disabled}
        status={result?.type}
        url={request?.url}
        onPress={() => promptAsync({ useProxy })}
      />
      <View style={{ padding: 8 }}>
        <KVText
          href={request?.redirectUri}
          k="Redirect URL"
          v={request?.redirectUri || 'Loading...'}
        />
        <AuthResult result={result?.params} />
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
      <B>{k}</B> {v}
    </Text>
  );
}
