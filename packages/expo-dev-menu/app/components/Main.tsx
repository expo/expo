import {
  View,
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
import { Platform } from 'react-native';
import { TouchableWithoutFeedback, Switch } from 'react-native-gesture-handler';

import { useAppInfo } from '../hooks/useAppInfo';
import { useClipboard } from '../hooks/useClipboard';
import { useDevSettings } from '../hooks/useDevSettings';

export function Main() {
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

  return (
    <View flex="1" bg="secondary">
      <View padding="medium" bg="default">
        <Row align="start">
          <Row align="center">
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

            <View>
              <Heading weight="bold">{appInfo.appName}</Heading>
              <Spacer.Vertical size="tiny" />
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
          </Row>

          <Spacer.Horizontal />
          <GestureHandlerTouchableWrapper onPress={actions.closeMenu}>
            <Button.ScaleOnPressContainer
              onPress={actions.closeMenu}
              bg="ghost"
              rounded="full"
              minScale={0.8}>
              <View padding="micro">
                <XIcon />
              </View>
            </Button.ScaleOnPressContainer>
          </GestureHandlerTouchableWrapper>
        </Row>
      </View>

      <Divider />

      {Boolean(appInfo.hostUrl) && (
        <>
          <View bg="default" padding="medium">
            <Text color="secondary">Connected to local server</Text>

            <Spacer.Vertical size="small" />

            <Row align="center">
              <StatusIndicator style={{ width: 10, height: 10 }} status="success" />
              <Spacer.Horizontal size="tiny" />
              <View flex="1">
                <Text type="mono" numberOfLines={1} size="small">
                  {appInfo.hostUrl}
                </Text>
              </View>
              <Spacer.Horizontal size="small" />
            </Row>
          </View>

          <Divider />
        </>
      )}

      <Row padding="small">
        <View flex="1">
          <ActionButton
            icon={<HomeFilledIcon />}
            label="Go home"
            onPress={actions.navigateToLauncher}
          />
        </View>

        <Spacer.Horizontal size="medium" />

        <View flex="1">
          <ActionButton icon={<ClipboardIcon />} label="Copy link" onPress={onCopyUrlPress} />
        </View>

        <Spacer.Horizontal size="medium" />

        <View flex="1">
          <ActionButton icon={<RefreshIcon />} label="Reload" onPress={actions.reload} />
        </View>
      </Row>

      <View mx="small">
        <View roundedTop="large">
          <SettingsRowButton
            label="Toggle performance monitor"
            icon={<PerformanceIcon />}
            onPress={actions.togglePerformanceMonitor}
          />
        </View>
        <Divider />
        <SettingsRowButton
          label="Toggle element inspector"
          icon={<InspectElementIcon />}
          onPress={actions.toggleElementInspector}
        />
        <Divider />
        <View bg="default">
          <SettingsRowSwitch
            testID="local-dev-tools"
            label="Local dev tools"
            icon={<DebugIcon />}
            isEnabled={devSettings.isDebuggingRemotely}
            setIsEnabled={actions.toggleDebugRemoteJS}
          />
        </View>
        <Divider />
        <View bg="default" roundedBottom="large">
          <SettingsRowSwitch
            testID="fast-refresh"
            label="Fast refresh"
            icon={<RunIcon />}
            isEnabled={devSettings.isHotLoadingEnabled}
            setIsEnabled={actions.toggleFastRefresh}
          />
        </View>
      </View>

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

        <GestureHandlerTouchableWrapper onPress={onCopyAppInfoPress}>
          <Button.ScaleOnPressContainer
            bg="default"
            roundedTop="none"
            roundedBottom="large"
            disabled={hasCopiedAppInfoContent}>
            <Row px="medium" py="small" align="center" bg="default">
              <Text color="link" size="medium">
                {hasCopiedAppInfoContent ? 'Copied to clipboard!' : 'Tap to Copy All'}
              </Text>
            </Row>
          </Button.ScaleOnPressContainer>
        </GestureHandlerTouchableWrapper>
      </View>
    </View>
  );
}

type ActionButtonProps = {
  icon: React.ReactElement<any>;
  label: string;
  onPress: () => void;
};

function ActionButton({ icon, label, onPress }: ActionButtonProps) {
  return (
    <GestureHandlerTouchableWrapper onPress={onPress}>
      <Button.ScaleOnPressContainer minScale={0.9} bg="default" onPress={onPress}>
        <View padding="small" rounded="large" bg="default">
          <View align="centered">{icon}</View>

          <Spacer.Vertical size="tiny" />

          <Text size="small" align="center">
            {label}
          </Text>
        </View>
      </Button.ScaleOnPressContainer>
    </GestureHandlerTouchableWrapper>
  );
}

type SettingsRowButtonProps = {
  icon: React.ReactElement<any>;
  label: string;
  description?: string;
  onPress: () => void;
};

function SettingsRowButton({ label, icon, description = '', onPress }: SettingsRowButtonProps) {
  return (
    <GestureHandlerTouchableWrapper onPress={onPress}>
      <Button.ScaleOnPressContainer onPress={onPress} bg="default">
        <Row padding="small" align="center" bg="default">
          <View width="large" height="large">
            {icon}
          </View>

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
      </Button.ScaleOnPressContainer>
    </GestureHandlerTouchableWrapper>
  );
}

type SettingsRowSwitchProps = {
  icon: React.ReactElement<any>;
  label: string;
  description?: string;
  isEnabled?: boolean;
  setIsEnabled: (isEnabled: boolean) => void;
  testID: string;
};

function SettingsRowSwitch({
  label,
  description = '',
  icon,
  isEnabled,
  setIsEnabled,
  testID,
}: SettingsRowSwitchProps) {
  return (
    <View>
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
            value={isEnabled}
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

function GestureHandlerTouchableWrapper({ onPress, children }) {
  if (Platform.OS === 'android') {
    return <TouchableWithoutFeedback onPress={onPress}>{children}</TouchableWithoutFeedback>;
  }

  return children;
}
