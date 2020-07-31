import * as React from 'react';
import { Image, Linking, Platform, Text, View } from 'react-native';
import { ColorSchemeName } from 'react-native-appearance';
import FadeIn from 'react-native-fade-in-image';
import { TouchableOpacity } from 'react-native-gesture-handler';
import semver from 'semver';

import Colors from '../constants/Colors';
import { Experience } from './ExperienceView.types';
import { Ionicons, Privacy } from './Icons';
import { StyledText } from './Text';

export default function ExperienceHeader(props: {
  themeName: ColorSchemeName;
  experience: Experience;
}) {
  const onPress = () => {
    Linking.openURL(`exp://exp.host/${props.experience.fullName}`);
  };
  const { themeName } = props;
  const storeUrl = Platform.select({
    android: props.experience.playStoreUrl,
    ios: props.experience.appStoreUrl,
  });

  return (
    <View
      style={{
        marginTop: 144,
        backgroundColor: Colors[themeName].bodyBackground,
        width: '100%',
        alignItems: 'center',
      }}>
      <View
        style={{
          marginTop: -60,
        }}>
        <ExperienceIcon
          source={props.experience.icon ? props.experience.icon.url : props.experience.iconUrl}
          size={120}
          onPress={onPress}
          isPrivate={props.experience.privacy !== 'public'}
        />
      </View>
      <Text
        onPress={onPress}
        style={{
          marginTop: 24,
          fontWeight: 'bold',
          fontSize: 24,
          marginBottom: 8,
          color: Colors[themeName].text,
        }}>
        {props.experience.name}
      </Text>
      <Text style={{ color: Colors[themeName].text, opacity: 0.4 }}>
        By {props.experience.username}
      </Text>

      <View
        style={{ width: '100%', justifyContent: 'space-around', flexDirection: 'row', flex: 1 }}>
        {storeUrl && (
          <HeaderButton
            iconName={Platform.select({ ios: 'ios-appstore', default: 'md-appstore' })}
            title="Published"
            onPress={() => {
              Linking.openURL(storeUrl!);
            }}
          />
        )}

        <HeaderButton value={semver.major(props.experience.sdkVersion)} title="SDK Version" />

        {props.experience.githubUrl && (
          <HeaderButton
            iconName="logo-github"
            title="Repo"
            onPress={() => {
              Linking.openURL(props.experience.githubUrl!);
            }}
          />
        )}
      </View>
    </View>
  );
}

function HeaderButton({ title, iconName, value, onPress }) {
  return (
    <TouchableOpacity
      style={{
        justifyContent: 'center',
        flex: 1,
        minWidth: '33%',
        alignItems: 'center',
        paddingVertical: 12,
      }}
      disabled={!onPress}
      onPress={onPress}>
      {iconName && (
        <Ionicons
          name={iconName}
          size={20}
          lightColor={Colors.dark.absolute}
          darkColor={Colors.light.absolute}
        />
      )}
      {value && <StyledText style={{ fontSize: 20 }}>{value}</StyledText>}
      <StyledText
        style={{
          opacity: 0.6,
          fontSize: 10,
          fontWeight: 'bold',
          textAlign: 'center',
        }}>
        {title}
      </StyledText>
    </TouchableOpacity>
  );
}
function ExperienceIcon({ source, size, isPrivate, onPress }: any) {
  return (
    <TouchableOpacity
      style={{
        borderRadius: 12,
        overflow: 'hidden',
      }}
      onPress={onPress}>
      <FadeIn placeholderColor="#eee">
        <>
          <Image
            source={source ? { uri: source } : require('../assets/placeholder-app-icon.png')}
            style={{
              width: size,
              height: size,
            }}
          />
          {isPrivate && <Privacy size={24} style={{ position: 'absolute', right: 4, bottom: 4 }} />}
        </>
      </FadeIn>
    </TouchableOpacity>
  );
}
