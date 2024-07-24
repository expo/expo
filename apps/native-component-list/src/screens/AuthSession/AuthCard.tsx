import React from 'react';
import { View, TouchableOpacity, Text, Image } from 'react-native';

const statusToSubtitle: Record<string, string> = {
  cancel: 'Cancelled',
  dismiss: 'Cancelled',
  error: 'Failed',
  success: 'Success',
};

const providers: Record<string, any> = {
  facebook: {
    name: 'Facebook',
    image:
      'https://github.com/expo/expo/blob/main/docs/public/static/images/sdk/auth-session/facebook.png?raw=true',
    color: '#1877F2',
  },
  imgur: {
    name: 'Imgur',
    image:
      'https://github.com/expo/expo/blob/main/docs/public/static/images/sdk/auth-session/imgur.png?raw=true',
    color: '#1BB76E',
  },
  uber: {
    name: 'Uber',
    image:
      'https://github.com/expo/expo/blob/main/docs/public/static/images/sdk/auth-session/uber.png?raw=true',
    color: '#000',
  },
  google: {
    name: 'Google',
    image:
      'https://github.com/expo/expo/blob/main/docs/public/static/images/sdk/auth-session/google.png?raw=true',
    color: '#4285F4',
  },
  google_firebase: {
    name: 'Google Firebase',
    image:
      'https://github.com/expo/expo/blob/main/docs/public/static/images/sdk/auth-session/google.png?raw=true',
    color: '#4285F4',
  },
  azure: {
    name: 'Azure',
    image:
      'https://github.com/expo/expo/blob/main/docs/public/static/images/sdk/auth-session/azure.png?raw=true',
    color: '#0089D6',
  },
  fitbit: {
    name: 'FitBit',
    image:
      'https://github.com/expo/expo/blob/main/docs/public/static/images/sdk/auth-session/fitbit.png?raw=true',
    color: '#00B0B9',
  },
  reddit: {
    name: 'Reddit',
    image:
      'https://github.com/expo/expo/blob/main/docs/public/static/images/sdk/auth-session/reddit.png?raw=true',
    color: '#FF4500',
  },
  dropbox: {
    name: 'Dropbox',
    image:
      'https://github.com/expo/expo/blob/main/docs/public/static/images/sdk/auth-session/dropbox.png?raw=true',
    color: '#0061FF',
  },
  coinbase: {
    name: 'Coinbase',
    image:
      'https://github.com/expo/expo/blob/main/docs/public/static/images/sdk/auth-session/coinbase.png?raw=true',
    color: '#0667D0',
  },
  github: {
    name: 'Github',
    image:
      'https://github.com/expo/expo/blob/main/docs/public/static/images/sdk/auth-session/github.png?raw=true',
    color: '#181717',
  },
  slack: {
    name: 'Slack',
    image:
      'https://github.com/expo/expo/blob/main/docs/public/static/images/sdk/auth-session/slack.png?raw=true',
    color: '#4A154B',
  },
  spotify: {
    name: 'Spotify',
    image:
      'https://github.com/expo/expo/blob/main/docs/public/static/images/sdk/auth-session/spotify.png?raw=true',
    color: '#1ED760',
  },
  strava: {
    name: 'Strava',
    image:
      'https://github.com/expo/expo/blob/main/docs/public/static/images/sdk/auth-session/strava.png?raw=true',
    color: '#FC4C02',
  },
  twitch: {
    name: 'Twitch',
    image:
      'https://github.com/expo/expo/blob/main/docs/public/static/images/sdk/auth-session/twitch.png?raw=true',
    color: '#9146FF',
  },
  okta: {
    name: 'Okta',
    image:
      'https://github.com/expo/expo/blob/main/docs/public/static/images/sdk/auth-session/okta.png?raw=true',
    color: '#007DC1',
  },
  identity4: {
    name: 'Identity 4',
    image:
      'https://github.com/expo/expo/blob/main/docs/public/static/images/sdk/auth-session/identity4.png?raw=true',
    color: '#F78C40',
  },
  beyondidentity: {
    name: 'Beyond Identity',
    image:
      'https://github.com/expo/expo/blob/main/docs/public/static/images/sdk/auth-session/beyondidentity.png?raw=true',
    color: '#4673D3',
  },
};

function SocialImage({ image }: any) {
  const size = 48;
  return (
    <Image
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: 'white',
        resizeMode: 'cover',
        borderWidth: 1,
        borderColor: 'white',
      }}
      source={image}
    />
  );
}

function Card({ style, ...props }: any) {
  return (
    <TouchableOpacity
      activeOpacity={0.6}
      style={[
        {
          backgroundColor: 'white',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 5,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,

          elevation: 5,
        },
        style,
      ]}
      {...props}
    />
  );
}

export default function AuthCard({
  name,
  disabled,
  status = '',
  url,
  onPress,
}: {
  name: string;
  url?: string | null;
  disabled?: boolean;
  status?: string;
  onPress: (color: string) => void;
}) {
  const provider = providers[name];
  const subtitle = statusToSubtitle[status];

  return (
    <Card
      disabled={disabled}
      style={{ backgroundColor: provider.color, opacity: disabled ? 0.6 : 1 }}
      onPress={() => onPress(provider.color)}>
      <SocialImage image={{ uri: provider.image }} />
      <View style={{ marginLeft: 8 }}>
        <Text style={{ fontWeight: 'bold', color: 'white' }}>
          {disabled ? `${provider.name} is disabled` : `Sign In with ${provider.name}`}
        </Text>
        {subtitle && (
          <Text
            style={{
              opacity: 0.9,
              marginTop: 2,
              fontSize: 14,
              color: 'white',
            }}>
            {subtitle}
          </Text>
        )}
        {url && (
          <Text
            style={{
              opacity: 0.9,
              marginTop: 2,
              fontSize: 14,
              color: 'white',
            }}>
            {url}
          </Text>
        )}
      </View>
    </Card>
  );
}
