import * as WebBrowser from 'expo-web-browser';
import * as React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import Colors from '../constants/Colors';
import SharedStyles from '../constants/SharedStyles';
import PrimaryButton from './PrimaryButton';
import { StyledText } from './Text';
import { StyledView } from './Views';

function handleLearnMorePress() {
  WebBrowser.openBrowserAsync('https://snack.expo.io');
}

export default function EmptyProfileSnacksNotice({ isOwnProfile }: { isOwnProfile: boolean }) {
  if (isOwnProfile) {
    return (
      <StyledView style={styles.container} lightBackgroundColor={Colors.light.greyBackground}>
        <StyledText style={[SharedStyles.noticeDescriptionText, styles.descriptionText]}>
          Snacks that you save to your profile will appear here!
        </StyledText>

        <PrimaryButton
          plain
          onPress={handleLearnMorePress}
          fallback={TouchableOpacity}
          style={{ marginBottom: 5 }}>
          Learn more about Snack
        </PrimaryButton>
      </StyledView>
    );
  }
  return (
    <StyledView style={styles.container} lightBackgroundColor={Colors.light.greyBackground}>
      <StyledText style={[SharedStyles.noticeDescriptionText, styles.descriptionText]}>
        No saved Snacks
      </StyledText>
    </StyledView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 5,
    alignItems: 'flex-start',
    paddingHorizontal: 15,
  },
  descriptionText: {
    textAlign: 'left',
    marginHorizontal: 0,
    marginBottom: 10,
    padding: 0,
  },
});
