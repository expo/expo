import { CheckIcon, spacing } from '@expo/styleguide-native';
import { useNavigation } from '@react-navigation/native';
import * as Application from 'expo-application';
import {
  Text,
  View,
  TextInput,
  Button,
  Heading,
  Spacer,
  useExpoTheme,
} from 'expo-dev-client-components';
import * as Device from 'expo-device';
import * as React from 'react';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';

import { APIV2Client } from '../../api/APIV2Client';
import { useInitialData } from '../../utils/InitialDataContext';

const EMAIL_REGEX =
  /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i;

export function FeedbackFormScreen() {
  const theme = useExpoTheme();
  const navigation = useNavigation();
  const { currentUserData } = useInitialData();

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string>();

  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState(currentUserData?.meUserActor?.bestContactEmail || '');

  async function onSubmit() {
    setError(undefined);
    setSubmitting(true);
    try {
      const body = {
        feedback,
        email: undefined as string | undefined,
        metadata: {
          os: `${Device.osName} ${Device.osVersion}`,
          model: Device.modelName,
          expoGoVersion: Application.nativeApplicationVersion,
        },
      };
      if (email.trim().length > 0) {
        if (!EMAIL_REGEX.test(email)) {
          setError('Please enter a valid email address.');
          return;
        }
        body.email = email;
      }
      const api = new APIV2Client();
      await api.sendUnauthenticatedApiV2Request('/feedback/expo-go-send', {
        body,
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
      <View flex="1" px="medium" py="24">
        <View style={styles.thanksForSharingContainer} pb="12">
          <CheckIcon color={theme.status.success} size={80} />
          <Text type="InterBold" size="large">
            Thanks for sharing your feedback!
          </Text>
          <Text size="small">Your feedback will help us make our app better.</Text>
        </View>
        <Button.FadeOnPressContainer padding="tiny" onPress={navigation.goBack} bg="primary">
          <Button.Text align="center" size="medium" color="primary" type="InterSemiBold">
            Continue
          </Button.Text>
        </Button.FadeOnPressContainer>
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
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              value={email}
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
  thanksForSharingContainer: {
    alignItems: 'center',
  },
});
