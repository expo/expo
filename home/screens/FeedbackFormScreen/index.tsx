import { CheckIcon, spacing } from '@expo/styleguide-native';
import { APIV2Client } from 'api/APIV2Client';
import {
  Text,
  View,
  TextInput,
  Button,
  Heading,
  Spacer,
  useExpoTheme,
} from 'expo-dev-client-components';
import * as React from 'react';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';

export function FeedbackFormScreen() {
  const theme = useExpoTheme();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string>();

  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');

  async function onSubmit() {
    setError(undefined);
    setSubmitting(true);
    try {
      const api = new APIV2Client();
      await api.sendOptionallyAuthenticatedApiV2Request('/feedback/expo-go-send', {
        body: {
          feedback,
          email,
        },
      });
      setSubmitted(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <View flex="1" padding="medium" align="centered">
        <CheckIcon color={theme.status.success} size={50} />
        <Text type="InterBold">Thanks for sharing your feedback!</Text>
        <Text size="small">Your feedback will help us make our app better.</Text>
      </View>
    );
  }

  return (
    <View flex="1">
      <ScrollView style={{ flexGrow: 0 }} alwaysBounceVertical={false}>
        <View padding="medium" rounded="medium">
          <Text color="secondary" size="small">
            Add your feedback to help us improve this our app.
          </Text>
          <Heading size="small" style={{ marginVertical: spacing[1] }} type="InterSemiBold">
            Email (optional)
          </Heading>
          <View bg="default" border="default" rounded="medium" padding="tiny">
            <TextInput
              px="2"
              py="1"
              onChangeText={setEmail}
              editable={!submitting}
              placeholder="your@email.com"
            />
          </View>
          <Spacer.Vertical size="small" />
          <Heading size="small" style={{ marginVertical: spacing[1] }} type="InterSemiBold">
            Feedback
          </Heading>
          <View bg="default" border="default" rounded="medium">
            <TextInput
              multiline
              editable={!submitting}
              px="2"
              py="1"
              style={{ height: 200 }}
              onChangeText={setFeedback}
            />
          </View>
        </View>
      </ScrollView>
      <View px="medium">
        {error ? (
          <View mb="2">
            <Text color="error" type="InterSemiBold" size="small">
              Something went wrong. Please try again.
            </Text>
            <Text color="error" size="small">
              {error}
            </Text>
          </View>
        ) : null}
        <Button.FadeOnPressContainer
          padding="tiny"
          onPress={onSubmit}
          disabled={!feedback?.length || submitting}
          bg={feedback?.length && !submitting ? 'primary' : 'disabled'}>
          {submitting ? (
            <ActivityIndicator style={styles.activityIndicator} color="white" />
          ) : (
            <Button.Text align="center" size="medium" color="primary" type="InterSemiBold">
              Submit
            </Button.Text>
          )}
        </Button.FadeOnPressContainer>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  activityIndicator: {
    height: 26,
  },
});
