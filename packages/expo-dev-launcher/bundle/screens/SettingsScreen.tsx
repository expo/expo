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

import { useAppInfo } from '../hooks/useAppInfo';
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

  const appInfo = useAppInfo();

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
    const { runtimeVersion, sdkVersion, appName, appVersion } = appInfo;

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

        <View bg="default" rounded="large">
          <Button
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
          </Button>

          <Divider />

          <Button
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
          </Button>
        </View>

        <View padding="small">
          <Text color="secondary" size="small" leading="large">
            Selected gestures will toggle the developer menu while inside a preview. The menu allows
            you to reload or return to home, and exposes developer tools.
          </Text>
        </View>

        <Spacer.Vertical size="medium" />

        <View bg="default" rounded="large">
          <Row px="medium" py="small" align="center">
            <Text size="medium">Version</Text>
            <Spacer.Horizontal size="flex" />
            <Text>{appInfo?.appVersion}</Text>
          </Row>

          {Boolean(appInfo.runtimeVersion) && (
            <>
              <Divider />
              <Row px="medium" py="small" align="center">
                <Text size="medium">Runtime Version</Text>
                <Spacer.Horizontal size="flex" />
                <Text>{appInfo.runtimeVersion}</Text>
              </Row>
            </>
          )}

          {Boolean(appInfo.sdkVersion) && !appInfo.runtimeVersion && (
            <>
              <Divider />
              <Row px="medium" py="small" align="center">
                <Text size="medium">SDK Version</Text>
                <Spacer.Horizontal size="flex" />
                <Text>{appInfo.sdkVersion}</Text>
              </Row>
            </>
          )}

          <Divider />

          <Button onPress={onCopyPress} disabled={hasCopiedContent}>
            <Row px="medium" py="small" align="center">
              <Text color="primary" size="large">
                {hasCopiedContent ? 'Copied to clipboard!' : 'Tap to Copy All'}
              </Text>
            </Row>
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
