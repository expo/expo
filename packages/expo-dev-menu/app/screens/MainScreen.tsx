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
} from 'expo-dev-client-components';
import * as React from 'react';
import { Switch } from 'react-native';

import { useBuildInfo } from '../hooks/useBuildInfo';
import { useClipboard } from '../hooks/useClipboard';
import { useDevSettings } from '../hooks/useDevSettings';

export function MainScreen() {
  const buildInfo = useBuildInfo();
  const { devSettings, actions } = useDevSettings();

  const urlClipboard = useClipboard();
  const buildInfoClipboard = useClipboard();

  function onCopyUrlPress() {
    const { hostUrl } = buildInfo;
    urlClipboard.onCopyPress(hostUrl);
  }

  function onCopyBuildInfoPress() {
    const { runtimeVersion, sdkVersion, appName, appVersion } = buildInfo;
    buildInfoClipboard.onCopyPress({ runtimeVersion, sdkVersion, appName, appVersion });
  }

  const hasCopiedBuildInfoContent = Boolean(buildInfoClipboard.clipboardContent);

  return (
    <View flex="1" bg="secondary">
      <View padding="medium" bg="default">
        <Row align="start">
          <Row align="center">
            <View>
              <View height="xl" width="xl" overflow="hidden" bg="secondary" rounded="medium">
                {Boolean(buildInfo.appIcon) && (
                  <Image
                    source={{ uri: buildInfo.appIcon }}
                    style={{ flex: 1, resizeMode: 'contain' }}
                  />
                )}
              </View>
            </View>

            <Spacer.Horizontal size="small" />

            <View>
              <Heading size="small" weight="bold">
                {buildInfo.appName}
              </Heading>
              <Spacer.Vertical size="tiny" />
              {Boolean(buildInfo.runtimeVersion) && (
                <>
                  <Text size="small" color="secondary">
                    {`Runtime version: ${buildInfo.runtimeVersion}`}
                  </Text>
                </>
              )}

              {Boolean(buildInfo.sdkVersion) && !buildInfo.runtimeVersion && (
                <>
                  <Text size="small" color="secondary">
                    {`SDK version: ${buildInfo.sdkVersion}`}
                  </Text>
                </>
              )}
            </View>
          </Row>

          <Spacer.Horizontal size="flex" />

          <Button.ScaleOnPressContainer
            bg="ghost"
            rounded="full"
            minScale={0.8}
            onPress={actions.closeMenu}>
            <View padding="micro">
              <XIcon />
            </View>
          </Button.ScaleOnPressContainer>
        </Row>
      </View>

      <Divider />

      {Boolean(buildInfo.hostUrl) && (
        <>
          <View bg="default" padding="medium">
            <Text color="secondary">Connected to local server</Text>

            <Spacer.Vertical size="small" />

            <Row align="center">
              <StatusIndicator style={{ width: 10, height: 10 }} status="success" />
              <Spacer.Horizontal size="tiny" />
              <View flex="1">
                <Text type="mono" numberOfLines={1} size="small">
                  {buildInfo.hostUrl}
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

      <View mx="small" rounded="large" bg="default">
        <SettingsRowButton
          label="Toggle performance monitor"
          icon={<PerformanceIcon />}
          onPress={actions.togglePerformanceMonitor}
        />
        <Divider />
        <SettingsRowButton
          label="Toggle element inspector"
          icon={<InspectElementIcon />}
          onPress={actions.toggleElementInspector}
        />
        <Divider />
        <SettingsRowSwitch
          testID="local-dev-tools"
          label="Local dev tools"
          icon={<DebugIcon />}
          isEnabled={devSettings.isDebuggingRemotely}
          setIsEnabled={actions.toggleDebugRemoteJS}
        />
        <Divider />
        <SettingsRowSwitch
          testID="fast-refresh"
          label="Fast refresh"
          icon={<RunIcon />}
          isEnabled={devSettings.isHotLoadingEnabled}
          setIsEnabled={actions.toggleFastRefresh}
        />
      </View>

      <Spacer.Vertical size="large" />

      <View mx="small" rounded="large" overflow="hidden">
        <BuildInfoRow title="Version" value={buildInfo.appVersion} />
        <Divider />
        {Boolean(buildInfo.runtimeVersion) && (
          <>
            <BuildInfoRow title="Runtime version" value={buildInfo.runtimeVersion} />
            <Divider />
          </>
        )}

        {Boolean(buildInfo.sdkVersion) && !buildInfo.runtimeVersion && (
          <>
            <BuildInfoRow title="SDK Version" value={buildInfo.sdkVersion} />
            <Divider />
          </>
        )}

        <Button.ScaleOnPressContainer
          onPress={onCopyBuildInfoPress}
          disabled={hasCopiedBuildInfoContent}
          bg="default"
          roundedTop="none"
          roundedBottom="large">
          <Row px="medium" py="small" align="center">
            <Text color="primary" size="large">
              {hasCopiedBuildInfoContent ? 'Copied to clipboard!' : 'Tap to Copy All'}
            </Text>
          </Row>
        </Button.ScaleOnPressContainer>
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
    <Button.ScaleOnPressContainer minScale={0.9} bg="default" onPress={onPress}>
      <View padding="small" rounded="large">
        <View align="centered">{icon}</View>

        <Spacer.Vertical size="tiny" />

        <Text size="small" align="center">
          {label}
        </Text>
      </View>
    </Button.ScaleOnPressContainer>
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
    <Button.ScaleOnPressContainer onPress={onPress}>
      <Row padding="small" align="center">
        <View width="large" height="large">
          {icon}
        </View>

        <Spacer.Horizontal size="small" />

        <View>
          <Text>{label}</Text>
        </View>

        <Spacer.Horizontal size="flex" />

        <View style={{ width: 64, alignItems: 'flex-end' }} />
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

            <View style={{ width: 64 }} />
          </Row>
          <Spacer.Vertical size="tiny" />
        </View>
      )}
    </Button.ScaleOnPressContainer>
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

        <Spacer.Horizontal size="flex" />

        <View style={{ width: 64, alignItems: 'flex-end' }}>
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

            <View style={{ width: 64 }} />
          </Row>
          <Spacer.Vertical size="tiny" />
        </View>
      )}
    </View>
  );
}

type BuildInfoRowProps = {
  title: string;
  value: string;
};

function BuildInfoRow({ title, value }: BuildInfoRowProps) {
  return (
    <Row px="medium" py="small" align="center" bg="default">
      <Text size="medium">{title}</Text>
      <Spacer.Horizontal size="flex" />
      <Text>{value}</Text>
    </Row>
  );
}
