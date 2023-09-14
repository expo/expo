import {
  View,
  WarningIcon,
  Text,
  Heading,
  Row,
  Spacer,
  XIcon,
  Button,
  Divider,
  ClipboardIcon,
  DebugIcon,
  HomeFilledIcon,
  InspectElementIcon,
  PerformanceIcon,
  RefreshIcon,
  RunIcon,
  StatusIndicator,
  Image,
  scale,
} from 'expo-dev-client-components';
import * as React from 'react';
import { Platform, ScrollView, Switch } from 'react-native';
import semver from 'semver';

import { Onboarding } from './Onboarding';
import { useAppInfo } from '../hooks/useAppInfo';
import { useClipboard } from '../hooks/useClipboard';
import { useDevSettings } from '../hooks/useDevSettings';
import { isDevLauncherInstalled } from '../native-modules/DevLauncher';
import { hideMenu, fireCallbackAsync } from '../native-modules/DevMenu';

type MainProps = {
  registeredCallbacks?: string[];
  isDevice?: boolean;
};

export function Main({ registeredCallbacks = [], isDevice }: MainProps) {
  const appInfo = useAppInfo();
  const { devSettings, actions } = useDevSettings();

  const urlClipboard = useClipboard();
  const appInfoClipboard = useClipboard();

  function onCopyUrlPress() {
    const { hostUrl } = appInfo;
    urlClipboard.onCopyPress(hostUrl);
  }

  function onCopyAppInfoPress() {
    const { runtimeVersion, sdkVersion, appName, appVersion } = appInfo;
    appInfoClipboard.onCopyPress({ runtimeVersion, sdkVersion, appName, appVersion });
  }

  const hasCopiedAppInfoContent = Boolean(appInfoClipboard.clipboardContent);

  const {
    isElementInspectorAvailable,
    isHotLoadingAvailable,
    isPerfMonitorAvailable,
    isRemoteDebuggingAvailable,
  } = devSettings;
  const hasDisabledDevSettingOption =
    [
      isElementInspectorAvailable,
      isHotLoadingAvailable,
      isPerfMonitorAvailable,
      isRemoteDebuggingAvailable,
    ].filter((value) => value === false).length > 0;

  return (
    <View flex="1" bg="secondary">
      <View py="medium" bg="default">
        <Row align="start">
          <Spacer.Horizontal size="medium" />
          <Row align="center" shrink="1">
            <View>
              <View height="xl" width="xl" overflow="hidden" bg="secondary" rounded="medium">
                {Boolean(appInfo.appIcon) && (
                  <Image
                    source={{ uri: appInfo.appIcon }}
                    style={{ flex: 1, resizeMode: 'contain' }}
                  />
                )}
              </View>
            </View>

            <Spacer.Horizontal size="small" />

            <View shrink="1">
              <Row style={{ flexWrap: 'wrap' }}>
                <Heading weight="bold" numberOfLines={1}>
                  {appInfo.appName}
                </Heading>
              </Row>

              {Boolean(appInfo.runtimeVersion) && (
                <>
                  <Text size="small" color="secondary">
                    {`Runtime version: ${appInfo.runtimeVersion}`}
                  </Text>
                </>
              )}

              {Boolean(appInfo.sdkVersion) && !appInfo.runtimeVersion && (
                <>
                  <Text size="small" color="secondary">
                    {`SDK version: ${appInfo.sdkVersion}`}
                  </Text>
                </>
              )}
            </View>

            <Spacer.Horizontal />

            <View width="large" style={{ alignSelf: 'flex-start' }}>
              <Button.FadeOnPressContainer onPress={hideMenu} bg="ghost" rounded="full">
                <View padding="micro">
                  <XIcon />
                </View>
              </Button.FadeOnPressContainer>
            </View>

            <Spacer.Horizontal size="small" />
          </Row>
        </Row>
      </View>

      <Divider />
      <View style={{ flex: 1 }}>
        <ScrollView nestedScrollEnabled>
          {Boolean(appInfo.hostUrl) && (
            <>
              <View bg="default" padding="medium">
                <Text color="secondary">Connected to:</Text>

                <Spacer.Vertical size="small" />
                <Button.FadeOnPressContainer
                  bg="default"
                  onPress={onCopyUrlPress}
                  testID="main.copyUrlButton">
                  <Row align="center">
                    <StatusIndicator style={{ width: 10, height: 10 }} status="success" />
                    <Spacer.Horizontal size="small" />
                    <Row flex="1" justify="between">
                      <Text type="mono" numberOfLines={2} size="small">
                        {appInfo.hostUrl}
                      </Text>

                      <ClipboardIcon />
                    </Row>
                    <Spacer.Horizontal size="small" />
                  </Row>
                </Button.FadeOnPressContainer>
              </View>

              <Divider />
            </>
          )}

          {registeredCallbacks.length > 0 && (
            <View>
              <View mx="large">
                <Heading size="small" color="secondary">
                  Custom Menu Items
                </Heading>
              </View>

              <Spacer.Vertical size="small" />

              <View mx="small">
                {registeredCallbacks.map((name, index, arr) => {
                  const isFirst = index === 0;
                  const isLast = index === arr.length - 1;
                  const onPress = () => fireCallbackAsync(name);

                  return (
                    <View key={name + index}>
                      <View
                        bg="default"
                        roundedTop={isFirst ? 'large' : 'none'}
                        roundedBottom={isLast ? 'large' : 'none'}>
                        <SettingsRowButton label={name} icon={null} onPress={onPress} />
                      </View>
                      {!isLast && <Divider />}
                    </View>
                  );
                })}
              </View>

              <Spacer.Vertical size="medium" />
            </View>
          )}

          <View margin="small">
            <View
              {...(isDevLauncherInstalled ? { roundedTop: 'large' } : { rounded: 'large' })}
              bg="default">
              <SettingsRowButton label="Reload" icon={<RefreshIcon />} onPress={actions.reload} />
            </View>
            {isDevLauncherInstalled && (
              <>
                <Divider />
                <View roundedBottom="large" bg="default">
                  <SettingsRowButton
                    label="Go home"
                    icon={<HomeFilledIcon />}
                    onPress={actions.navigateToLauncher}
                  />
                </View>
              </>
            )}
          </View>

          <View mx="small">
            <View bg="default" roundedTop="large">
              <SettingsRowButton
                disabled={!devSettings.isPerfMonitorAvailable}
                label="Toggle performance monitor"
                icon={<PerformanceIcon />}
                onPress={actions.togglePerformanceMonitor}
              />
            </View>
            <Divider />
            <View bg="default">
              <SettingsRowButton
                disabled={!devSettings.isElementInspectorAvailable}
                label="Toggle element inspector"
                icon={<InspectElementIcon />}
                onPress={actions.toggleElementInspector}
              />
            </View>
            <Divider />
            {devSettings.isJSInspectorAvailable ? (
              <View bg="default">
                <SettingsRowButton
                  disabled={!devSettings.isJSInspectorAvailable}
                  label="Open JS debugger"
                  icon={<DebugIcon />}
                  onPress={actions.openJSInspector}
                />
              </View>
            ) : (
              <View bg="default">
                <SettingsRowSwitch
                  disabled={
                    appInfo?.sdkVersion && semver.lt(appInfo.sdkVersion, '49.0.0')
                      ? !devSettings.isRemoteDebuggingAvailable
                      : true
                  }
                  testID="remote-js-debugger"
                  label="Remote JS debugger"
                  icon={<DebugIcon />}
                  isEnabled={devSettings.isDebuggingRemotely}
                  setIsEnabled={actions.toggleDebugRemoteJS}
                  description={
                    !appInfo?.sdkVersion || semver.lt(appInfo.sdkVersion, '49.0.0')
                      ? `This is not compatible with ${
                          appInfo?.engine ?? 'JSC'
                        } in this SDK version, please use Hermes to debug.`
                      : undefined
                  }
                />
              </View>
            )}
            <Divider />
            <View bg="default" roundedBottom="large">
              <SettingsRowSwitch
                disabled={!devSettings.isHotLoadingAvailable}
                testID="fast-refresh"
                label="Fast refresh"
                icon={<RunIcon />}
                isEnabled={devSettings.isHotLoadingEnabled}
                setIsEnabled={actions.toggleFastRefresh}
              />
            </View>
          </View>

          {appInfo.engine === 'Hermes' && (
            <>
              <Spacer.Vertical size="large" />

              <View mx="small">
                <View bg="warning" padding="medium" rounded="medium" border="warning">
                  <Row align="center">
                    <WarningIcon />

                    <Spacer.Horizontal size="tiny" />

                    <Heading color="warning" size="small" style={{ top: 1 }}>
                      Warning
                    </Heading>
                  </Row>

                  <Spacer.Vertical size="small" />

                  <View>
                    <Text size="small" color="warning">
                      Debugging not working? Try manually reloading first
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {!hasDisabledDevSettingOption && (
            <>
              <Spacer.Vertical size="large" />
              <Text size="small" color="secondary" align="center">
                Some settings are unavailable for this development build.
              </Text>
            </>
          )}

          <Spacer.Vertical size="large" />

          <View mx="small" rounded="large" overflow="hidden">
            <AppInfoRow title="Version" value={appInfo.appVersion} />
            <Divider />
            {Boolean(appInfo.runtimeVersion) && (
              <>
                <AppInfoRow title="Runtime version" value={appInfo.runtimeVersion} />
                <Divider />
              </>
            )}

            {Boolean(appInfo.sdkVersion) && !appInfo.runtimeVersion && (
              <>
                <AppInfoRow title="SDK Version" value={appInfo.sdkVersion} />
                <Divider />
              </>
            )}

            <Button.FadeOnPressContainer
              bg="default"
              roundedTop="none"
              roundedBottom="large"
              onPress={onCopyAppInfoPress}
              disabled={hasCopiedAppInfoContent}>
              <Row px="medium" py="small" align="center" bg="default">
                <Text color="link" size="medium">
                  {hasCopiedAppInfoContent ? 'Copied to clipboard!' : 'Tap to Copy All'}
                </Text>
              </Row>
            </Button.FadeOnPressContainer>
          </View>

          <Spacer.Vertical size="large" />
          <View mx="small" rounded="large" overflow="hidden">
            <Button.FadeOnPressContainer
              bg="default"
              roundedTop="none"
              roundedBottom="large"
              onPress={actions.openRNDevMenu}>
              <Row px="medium" py="small" align="center" bg="default">
                <Text>Open React Native dev menu</Text>
              </Row>
            </Button.FadeOnPressContainer>
          </View>

          {Platform.OS === 'android' && <View style={{ height: 50 }} />}
          <Spacer.Vertical size="large" />
        </ScrollView>

        <Onboarding isDevice={isDevice} />
      </View>
    </View>
  );
}

type SettingsRowButtonProps = {
  icon: React.ReactElement<any>;
  label: string;
  description?: string;
  onPress: () => void;
  disabled?: boolean;
};

function SettingsRowButton({
  label,
  icon,
  description = '',
  onPress,
  disabled,
}: SettingsRowButtonProps) {
  return (
    <Button.FadeOnPressContainer onPress={onPress} bg="default" disabled={disabled}>
      <Row padding="small" align="center" bg="default" style={{ opacity: disabled ? 0.75 : 1 }}>
        {icon && (
          <View width="large" height="large">
            {icon}
          </View>
        )}

        <Spacer.Horizontal size="small" />

        <View>
          <Text>{label}</Text>
        </View>

        <Spacer.Horizontal />

        <View width="16" style={{ alignItems: 'flex-end' }} />
      </Row>

      {Boolean(description) && (
        <View style={{ transform: [{ translateY: -scale['3'] }] }}>
          <Row px="small" align="center">
            <Spacer.Horizontal size="large" />

            <View shrink="1" px="small">
              <Text size="small" color="secondary" leading="large">
                {description}
              </Text>
            </View>

            <View width="16" />
          </Row>
          <Spacer.Vertical size="tiny" />
        </View>
      )}
    </Button.FadeOnPressContainer>
  );
}

type SettingsRowSwitchProps = {
  icon: React.ReactElement<any>;
  label: string;
  description?: string;
  isEnabled?: boolean;
  setIsEnabled: (isEnabled: boolean) => void;
  testID: string;
  disabled?: boolean;
};

function SettingsRowSwitch({
  label,
  description = '',
  icon,
  isEnabled,
  setIsEnabled,
  disabled,
  testID,
}: SettingsRowSwitchProps) {
  return (
    <View style={{ opacity: disabled ? 0.75 : 1 }} pointerEvents={disabled ? 'none' : 'auto'}>
      <Row padding="small" align="center">
        <View width="large" height="large">
          {icon}
        </View>

        <Spacer.Horizontal size="small" />

        <View>
          <Text>{label}</Text>
        </View>

        <Spacer.Horizontal />

        <View width="16" style={{ alignItems: 'flex-end' }}>
          <Switch
            testID={testID}
            disabled={disabled}
            value={isEnabled && !disabled}
            onValueChange={() => setIsEnabled(!isEnabled)}
          />
        </View>
      </Row>

      {Boolean(description) && (
        <View style={{ transform: [{ translateY: -8 }] }}>
          <Row px="small" align="center">
            <Spacer.Horizontal size="large" />

            <View shrink="1" px="small">
              <Text size="small" color="secondary" leading="large">
                {description}
              </Text>
            </View>

            <View style={{ width: scale[16] }} />
          </Row>
          <Spacer.Vertical size="tiny" />
        </View>
      )}
    </View>
  );
}

type AppInfoRowProps = {
  title: string;
  value: string;
};

function AppInfoRow({ title, value }: AppInfoRowProps) {
  return (
    <Row px="medium" py="small" align="center" bg="default">
      <Text size="medium">{title}</Text>
      <Spacer.Horizontal />
      <Text>{value}</Text>
    </Row>
  );
}
