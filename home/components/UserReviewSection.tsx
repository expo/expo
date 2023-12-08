import { iconSize, XIcon, spacing, typography } from '@expo/styleguide-native';
import { Row, Text, useExpoTheme, View, Button } from 'expo-dev-client-components';
import { CommonAppDataFragment, CommonSnackDataFragment } from 'graphql/types';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { useUserReviewCheck } from '../utils/useUserReviewCheck';

type Props = {
  apps?: CommonAppDataFragment[];
  snacks?: CommonSnackDataFragment[];
};

export default function UserReviewSection({ snacks, apps }: Props) {
  const { shouldShowReviewSection, requestStoreReview, dismissReviewSection, provideFeedback } =
    useUserReviewCheck({
      apps,
      snacks,
    });
  const theme = useExpoTheme();

  if (!shouldShowReviewSection) {
    return null;
  }

  return (
    <View bg="default" rounded="large" border="default" overflow="hidden">
      <TouchableOpacity onPress={dismissReviewSection} style={styles.dismissButton}>
        <XIcon size={iconSize.regular} color={theme.icon.default} />
      </TouchableOpacity>
      <View padding="medium">
        <Text type="InterBold" size="small" style={styles.title}>
          Enjoying Expo Go?
        </Text>
        <Text size="small" type="InterRegular" style={styles.subtitle}>
          Whether you love us or feel we could be doing better, let us know, your feedback will help
          us improve the app.
        </Text>
        <Row style={{ gap: 10 }}>
          <Button.FadeOnPressContainer
            flex="1"
            bg="secondary"
            onPress={provideFeedback}
            padding="tiny">
            <Button.Text
              align="center"
              size="medium"
              color="secondary"
              type="InterSemiBold"
              style={typography.fontSizes[14]}>
              Not really
            </Button.Text>
          </Button.FadeOnPressContainer>
          <Button.FadeOnPressContainer
            flex="1"
            bg="primary"
            onPress={requestStoreReview}
            padding="tiny">
            <Button.Text
              align="center"
              size="medium"
              color="primary"
              type="InterSemiBold"
              style={typography.fontSizes[14]}>
              Love it!
            </Button.Text>
          </Button.FadeOnPressContainer>
        </Row>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dismissButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  title: {
    marginBottom: spacing[2],
  },
  subtitle: {
    marginBottom: spacing[2],
  },
});
