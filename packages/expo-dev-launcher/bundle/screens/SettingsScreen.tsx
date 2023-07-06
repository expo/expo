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
  TextInput,
} from 'expo-dev-client-components';
import * as React from 'react';
import { ScrollView, Switch } from 'react-native';
import { useQueryClient } from 'react-query';

import { SafeAreaTop } from '../components/SafeAreaTop';
import { ScreenContainer } from '../components/ScreenContainer';
import { Toasts } from '../components/Toasts';
import { copyToClipboardAsync } from '../native-modules/DevLauncherInternal';
import { useBuildInfo } from '../providers/BuildInfoProvider';
import { useDevMenuPreferences } from '../providers/DevMenuPreferencesProvider';
import { useQueryOptions } from '../providers/QueryProvider';
import { useToastStack } from '../providers/ToastStackProvider';
import { useSetUpdatesConfig, useUpdatesConfig } from '../providers/UpdatesConfigProvider';
import { useUser } from '../providers/UserContextProvider';

export function SettingsScreen() {
  const { userData } = useUser();
  const [, setClipboardError] = React.useState('');
  const [clipboardContent, setClipboardContent] = React.useState('');

  const {
    showsAtLaunch,
    setShowsAtLaunch,
    touchGestureEnabled,
    setTouchGestureEnabled,
    motionGestureEnabled,
    setMotionGestureEnabled,
  } = useDevMenuPreferences();

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
    <ScrollView testID="DevLauncherSettingsScreen" showsVerticalScrollIndicator={false}>
      <ScreenContainer>
        <SafeAreaTop />
        <Spacer.Vertical size="medium" />

        <View px="medium">
          <Heading size="large">Settings</Heading>
        </View>

        <View py="large" px="medium">
          <View bg="default" rounded="large">
            <Row px="medium" py="small" align="center">
              <ShowMenuIcon />
              <Spacer.Horizontal size="small" />
              <Text size="large">Show menu at launch</Text>
              <Spacer.Horizontal />
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
            <Heading color="secondary">Menu gestures</Heading>
          </View>

          <View>
            <Button.FadeOnPressContainer
              bg="default"
              roundedTop="large"
              roundedBottom="none"
              onPress={() => setMotionGestureEnabled(!motionGestureEnabled)}
              accessibilityState={{ checked: motionGestureEnabled }}>
              <Row px="medium" py="small" align="center" bg="default">
                <ShakeDeviceIcon />
                <Spacer.Horizontal size="small" />
                <Text size="large" color="default">
                  Shake device
                </Text>
                <Spacer.Horizontal />
                {motionGestureEnabled && <CheckIcon />}
              </Row>
            </Button.FadeOnPressContainer>

            <Divider />

            <Button.FadeOnPressContainer
              bg="default"
              roundedBottom="large"
              roundedTop="none"
              onPress={() => setTouchGestureEnabled(!touchGestureEnabled)}
              accessibilityState={{ checked: touchGestureEnabled }}>
              <Row px="medium" py="small" bg="default">
                <ThreeFingerPressIcon />
                <Spacer.Horizontal size="small" />
                <Text size="large" color="default">
                  Three-finger long-press
                </Text>
                <Spacer.Horizontal />
                {touchGestureEnabled && <CheckIcon />}
              </Row>
            </Button.FadeOnPressContainer>
          </View>

          <View padding="small">
            <Text color="secondary" size="small" leading="large">
              Selected gestures will toggle the developer menu while inside a preview. The menu
              allows you to reload or return to home and exposes developer tools.
            </Text>
          </View>

          <Spacer.Vertical size="medium" />

          <View rounded="large" overflow="hidden">
            <Row px="medium" py="small" align="center" bg="default">
              <Text>Version</Text>
              <Spacer.Horizontal />
              <Text>{buildInfo?.appVersion}</Text>
            </Row>

            {Boolean(buildInfo.runtimeVersion) && (
              <>
                <Divider />
                <Row px="medium" py="small" align="center" bg="default">
                  <Text>Runtime Version</Text>
                  <Spacer.Horizontal />
                  <Text>{buildInfo.runtimeVersion}</Text>
                </Row>
              </>
            )}

            {Boolean(buildInfo.sdkVersion) && !buildInfo.runtimeVersion && (
              <>
                <Divider />
                <Row px="medium" py="small" align="center" bg="default">
                  <Text>SDK Version</Text>
                  <Spacer.Horizontal />
                  <Text>{buildInfo.sdkVersion}</Text>
                </Row>
              </>
            )}

            <Divider />

            <Button.FadeOnPressContainer
              onPress={onCopyPress}
              disabled={hasCopiedContent}
              bg="default"
              roundedTop="none"
              roundedBottom="large">
              <Row px="medium" py="small" align="center" bg="default">
                <Text color="link" size="medium">
                  {hasCopiedContent ? 'Copied to clipboard!' : 'Tap to Copy All'}
                </Text>
              </Row>
            </Button.FadeOnPressContainer>
            {userData?.isExpoAdmin && (
              <>
                <Spacer.Vertical size="medium" />
                <DebugSettings />
                <Spacer.Vertical size="medium" />
                <UpdatesDebugSettings />
              </>
            )}
          </View>
        </View>
      </ScreenContainer>
    </ScrollView>
  );
}

function DebugSettings() {
  const queryClient = useQueryClient();
  const { queryOptions, setQueryOptions } = useQueryOptions();
  const toastStack = useToastStack();

  function setPageSize(pageSize: number) {
    setQueryOptions({
      ...queryOptions,
      pageSize,
    });
  }

  async function onClearQueryPress() {
    await queryClient.resetQueries();
    await queryClient.invalidateQueries();
    toastStack?.push(() => <Toasts.Info>Network cache was reset!</Toasts.Info>);
  }

  const pageSizeOptions = [1, 5, 10];

  return (
    <View>
      <View padding="medium">
        <Heading color="secondary">Debug Settings</Heading>
      </View>

      <View>
        <View>
          <Button.FadeOnPressContainer
            bg="default"
            roundedTop="large"
            roundedBottom="large"
            onPress={onClearQueryPress}>
            <Row px="medium" py="small" align="center" bg="default">
              <Text size="large" color="default">
                Clear network cache
              </Text>
              <Spacer.Horizontal />
            </Row>
          </Button.FadeOnPressContainer>

          <Spacer.Vertical size="large" />

          <View px="medium">
            <Heading size="small" color="secondary">
              Default Page Size
            </Heading>

            <Text color="secondary" size="small">
              Sets the number of items fetched for branches and updates
            </Text>
          </View>
          <Spacer.Vertical size="medium" />
          <View>
            {pageSizeOptions.map((pageSize, index, arr) => {
              const isSelected = queryOptions.pageSize === pageSize;
              const isFirst = index === 0;
              const isLast = index === arr.length - 1;

              return (
                <View key={pageSize}>
                  <Button.FadeOnPressContainer
                    bg="default"
                    roundedTop={isFirst ? 'large' : 'none'}
                    roundedBottom={isLast ? 'large' : 'none'}
                    onPress={() => setPageSize(pageSize)}
                    accessibilityState={{ checked: isSelected }}>
                    <Row px="medium" py="small" align="center" bg="default">
                      <Text size="large" color="default">
                        {pageSize}
                      </Text>
                      <Spacer.Horizontal />
                      {isSelected && <CheckIcon />}
                    </Row>
                  </Button.FadeOnPressContainer>
                  {!isLast && <Divider />}
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

function UpdatesDebugSettings() {
  const updatesConfig = useUpdatesConfig();
  const defaultUpdatesConfig = React.useRef(updatesConfig).current;
  const setUpdatesConfig = useSetUpdatesConfig();
  const toastStack = useToastStack();

  function onUrlChange({ nativeEvent: { text: appId } }) {
    let appliedAppId = appId;
    let usesEASUpdates = true;

    if (appId.length === 0) {
      appliedAppId = defaultUpdatesConfig.appId;
      usesEASUpdates = false;
    }

    setUpdatesConfig({ appId, usesEASUpdates });
    toastStack.push(() => <Toasts.Info>{`Updated appId to ${appliedAppId}`}</Toasts.Info>);
  }

  function onRuntimeVersionChange({ nativeEvent: { text: runtimeVersion } }) {
    let appliedRuntimeVersion = runtimeVersion;

    if (runtimeVersion.length === 0) {
      appliedRuntimeVersion = defaultUpdatesConfig.runtimeVersion;
    }

    setUpdatesConfig({ runtimeVersion });
    toastStack.push(() => (
      <Toasts.Info>{`Updated runtimeVersion to ${appliedRuntimeVersion}`}</Toasts.Info>
    ));
  }

  return (
    <View my="medium">
      <View px="medium">
        <Heading color="secondary">EAS Update Debug Settings</Heading>
        <Spacer.Vertical size="medium" />
      </View>

      <View px="medium">
        <Heading color="secondary">Current Settings</Heading>
        <Spacer.Vertical size="medium" />
      </View>

      <View bg="default" padding="medium" rounded="large">
        <Text type="mono">{JSON.stringify(updatesConfig, null, 2)}</Text>
      </View>

      <Spacer.Vertical size="medium" />

      <View px="medium">
        <Heading size="small" color="secondary">
          EAS Updates App ID
        </Heading>
        <Spacer.Vertical size="small" />
      </View>

      <View bg="default" rounded="large" py="small" px="small">
        <TextInput
          blurOnSubmit
          autoCapitalize="none"
          keyboardType="url"
          placeholder="Set App Id"
          defaultValue={updatesConfig?.appId ?? ''}
          onSubmitEditing={onUrlChange}
        />
      </View>
      <Spacer.Vertical size="small" />
      <View px="medium">
        <Heading size="small" color="secondary">
          Runtime Version
        </Heading>
      </View>
      <View bg="default" rounded="large" py="small" px="small">
        <TextInput
          blurOnSubmit
          autoCapitalize="none"
          keyboardType="url"
          placeholder="Set Runtime Version"
          defaultValue={updatesConfig?.runtimeVersion ?? ''}
          onSubmitEditing={onRuntimeVersionChange}
        />
      </View>

      <Spacer.Vertical size="large" />
    </View>
  );
}
