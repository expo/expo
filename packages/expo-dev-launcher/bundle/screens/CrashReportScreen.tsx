import { View, Text, Heading, Button, Row, Spacer } from 'expo-dev-client-components';
import * as React from 'react';
import { ScrollView } from 'react-native';

import { copyToClipboardAsync } from '../native-modules/DevLauncherInternal';
import { useBuildInfo } from '../providers/BuildInfoProvider';

export function CrashReportScreen({ route }) {
  const [, setClipboardError] = React.useState('');
  const [clipboardContent, setClipboardContent] = React.useState('');

  const buildInfo = useBuildInfo();

  const { message, stack, timestamp } = route.params;
  const date = new Date(timestamp).toUTCString();

  const timerRef = React.useRef(null);

  React.useEffect(() => {
    if (clipboardContent) {
      timerRef.current = setTimeout(() => {
        setClipboardContent('');
      }, 3000);
    }

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [clipboardContent]);

  const onCopyPress = async () => {
    const { runtimeVersion, sdkVersion, appName, appVersion } = buildInfo;

    const content = JSON.stringify(
      {
        appName,
        timestamp,
        message,
        runtimeVersion,
        sdkVersion,
        appVersion,
        stack,
      },
      null,
      2
    );

    setClipboardError('');
    setClipboardContent(content);

    await copyToClipboardAsync(content).catch((err) => {
      setClipboardError(err.message);
      setClipboardContent('');
    });
  };

  const hasCopiedContent = Boolean(clipboardContent);

  return (
    <ScrollView>
      <View py="medium">
        <View px="small">
          <Button.FadeOnPressContainer
            onPress={onCopyPress}
            disabled={hasCopiedContent}
            bg="default"
            roundedTop="large"
            roundedBottom="large">
            <Row px="medium" py="small" align="center">
              <Text color="primary" size="large">
                {hasCopiedContent ? 'Copied to clipboard!' : 'Tap to Copy Report'}
              </Text>
            </Row>
          </Button.FadeOnPressContainer>
        </View>

        <Spacer.Vertical size="large" />

        <Row px="small" align="center">
          <Heading color="secondary">Occured:</Heading>
        </Row>
        <Row margin="small">
          <Text>{date}</Text>
        </Row>

        <View>
          <Row px="small">
            <Heading color="secondary">Reason:</Heading>
          </Row>
          <Row margin="small">
            <Text>{message}</Text>
          </Row>
        </View>

        <View>
          <Row px="small">
            <Heading color="secondary">Stack trace:</Heading>
          </Row>

          <Row px="small">
            <Text style={{ fontSize: 8 }}>{stack}</Text>
          </Row>
        </View>
      </View>
    </ScrollView>
  );
}
