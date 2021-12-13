import {
  Button,
  Heading,
  Text,
  Divider,
  Row,
  Spacer,
  View,
  ShakeDeviceIcon,
  ShowMenuIcon,
  ThreeFingerPressIcon,
  CheckIcon,
} from 'expo-dev-client-components';
import * as React from 'react';
import { ScrollView, Switch } from 'react-native';

import { useBuildInfo } from '../hooks/useBuildInfo';
import { useDevMenuSettings } from '../hooks/useDevMenuSettings';
import { copyToClipboardAsync } from '../native-modules/DevLauncherInternal';

export function SettingsScreen() {
  const [clipboardError, setClipboardError] = React.useState('');
  const [clipboardContent, setClipboardContent] = React.useState('');

  const {
    showsAtLaunch,
    setShowsAtLaunch,
    touchGestureEnabled,
    setTouchGestureEnabled,
    motionGestureEnabled,
    setMotionGestureEnabled,
  } = useDevMenuSettings();

  const buildInfo = useBuildInfo();

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
        runtimeVersion,
        sdkVersion,
        appName,
        appVersion,
      },
      null,
      '\t'
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
      <Spacer.Vertical size="large" />

      <View py="large" px="medium">
        <View bg="default" rounded="large">
          <Row px="medium" py="small" align="center">
            <ShowMenuIcon />
            <Spacer.Horizontal size="small" />
            <Text size="large">Show menu at launch</Text>
            <Spacer.Horizontal size="flex" />
            <Switch
              accessibilityRole="switch"
              accessibilityLabel="Toggle showing menu at launch"
              value={showsAtLaunch}
              onValueChange={() => setShowsAtLaunch(!showsAtLaunch)}
            />
          </Row>
        </View>

        <Spacer.Vertical size="large" />

        <View padding="medium">
          <Heading size="small" color="secondary">
            Menu gestures
          </Heading>
        </View>

        <View>
          <Button.ScaleOnPressContainer
            bg="default"
            roundedTop="large"
            roundedBottom="none"
            onPress={() => setMotionGestureEnabled(!motionGestureEnabled)}
            accessibilityState={{ checked: motionGestureEnabled }}>
            <Row px="medium" py="small" align="center">
              <ShakeDeviceIcon />
              <Spacer.Horizontal size="small" />
              <Text size="large" color="secondary">
                Shake Device
              </Text>
              <Spacer.Horizontal size="flex" />
              {motionGestureEnabled && <CheckIcon />}
            </Row>
          </Button.ScaleOnPressContainer>

          <Divider />

          <Button.ScaleOnPressContainer
            bg="default"
            roundedBottom="large"
            roundedTop="none"
            onPress={() => setTouchGestureEnabled(!touchGestureEnabled)}
            accessibilityState={{ checked: touchGestureEnabled }}>
            <Row px="medium" py="small">
              <ThreeFingerPressIcon />
              <Spacer.Horizontal size="small" />
              <Text size="large" color="secondary">
                Three-finger long-press
              </Text>
              <Spacer.Horizontal size="flex" />
              {touchGestureEnabled && <CheckIcon />}
            </Row>
          </Button.ScaleOnPressContainer>
        </View>

        <View padding="small">
          <Text color="secondary" size="small" leading="large">
            Selected gestures will toggle the developer menu while inside a preview. The menu allows
            you to reload or return to home, and exposes developer tools.
          </Text>
        </View>

        <Spacer.Vertical size="medium" />

        <View rounded="large" overflow="hidden">
          <Row px="medium" py="small" align="center" bg="default">
            <Text size="medium">Version</Text>
            <Spacer.Horizontal size="flex" />
            <Text>{buildInfo?.appVersion}</Text>
          </Row>

          {Boolean(buildInfo.runtimeVersion) && (
            <>
              <Divider />
              <Row px="medium" py="small" align="center" bg="default">
                <Text size="medium">Runtime Version</Text>
                <Spacer.Horizontal size="flex" />
                <Text>{buildInfo.runtimeVersion}</Text>
              </Row>
            </>
          )}

          {Boolean(buildInfo.sdkVersion) && !buildInfo.runtimeVersion && (
            <>
              <Divider />
              <Row px="medium" py="small" align="center" bg="default">
                <Text size="medium">SDK Version</Text>
                <Spacer.Horizontal size="flex" />
                <Text>{buildInfo.sdkVersion}</Text>
              </Row>
            </>
          )}

          <Divider />

          <Button.ScaleOnPressContainer
            onPress={onCopyPress}
            disabled={hasCopiedContent}
            bg="default"
            roundedTop="none"
            roundedBottom="large">
            <Row px="medium" py="small" align="center">
              <Text color="primary" size="large">
                {hasCopiedContent ? 'Copied to clipboard!' : 'Tap to Copy All'}
              </Text>
            </Row>
          </Button.ScaleOnPressContainer>
        </View>
      </View>
    </ScrollView>
  );
}
