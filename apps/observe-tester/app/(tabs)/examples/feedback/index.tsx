import { ObserveInteractiveMarker } from 'expo-observe';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FeedbackButton } from '@/components/FeedbackButton';
import { StarFeedback } from '@/components/StarFeedback';
import { ThumbsFeedback } from '@/components/ThumbsFeedback';
import { useTheme } from '@/utils/theme';

export default function FeedbackIndex() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background.screen }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ObserveInteractiveMarker />
        <Text style={[styles.heading, { color: theme.text.default }]}>Thumbs up or down</Text>
        <ThumbsFeedback />
        <Text style={[styles.heading, { color: theme.text.default }]}>Five-star rating</Text>
        <StarFeedback />
      </ScrollView>
      <FeedbackButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: Platform.select({ ios: 30, android: 150 }),
  },
  heading: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
});
