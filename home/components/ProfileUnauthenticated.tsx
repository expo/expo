import { useNavigation } from '@react-navigation/native';
import * as React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import ScrollView from './NavigationScrollView';
import PrimaryButton from './PrimaryButton';
import { StyledText } from './Text';

export default function ProfileUnauthenticated() {
  const navigation = useNavigation();
  const _handleSignInPress = () => {
    navigation.navigate('SignIn');
  };

  const _handleSignUpPress = () => {
    navigation.navigate('SignUp');
  };

  const title = Platform.OS === 'ios' ? 'Sign in to Continue' : 'Your Profile';
  const description =
    Platform.OS === 'ios'
      ? 'Sign in or create an Expo account to view your projects.'
      : 'To access your own projects, please sign in or create an Expo account.';
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <StyledText style={styles.titleText}>{title}</StyledText>

      <StyledText
        style={styles.descriptionText}
        darkColor="#ccc"
        lightColor="rgba(36, 44, 58, 0.7)">
        {description}
      </StyledText>

      <PrimaryButton onPress={_handleSignInPress} fallback={TouchableOpacity}>
        Sign in to your account
      </PrimaryButton>

      <View style={{ marginBottom: 20 }} />

      <PrimaryButton plain onPress={_handleSignUpPress} fallback={TouchableOpacity}>
        Sign up for Expo
      </PrimaryButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 30,
  },
  titleText: {
    marginBottom: 15,
    fontWeight: '400',
    ...Platform.select({
      ios: {
        fontSize: 22,
      },
      android: {
        fontSize: 23,
      },
    }),
  },
  descriptionText: {
    textAlign: 'center',
    marginHorizontal: 15,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        fontSize: 15,
        lineHeight: 20,
      },
      android: {
        fontSize: 16,
        lineHeight: 24,
      },
    }),
  },
});
