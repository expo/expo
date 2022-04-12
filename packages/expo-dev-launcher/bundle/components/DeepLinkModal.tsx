import {
  View,
  Text,
  Row,
  Spacer,
  Button,
  StatusIndicator,
  ChevronRightIcon,
  Divider,
} from 'expo-dev-client-components';
import * as React from 'react';
import { ActivityIndicator, ScrollView } from 'react-native';

import { loadApp } from '../native-modules/DevLauncherInternal';
import { useDevSessions } from '../providers/DevSessionsProvider';
import { useModalStack } from '../providers/ModalStackProvider';
import { useRecentlyOpenedApps } from '../providers/RecentlyOpenedAppsProvider';
import { BaseModal } from './BaseModal';
import { LoadAppErrorModal } from './LoadAppErrorModal';

type DeepLinkModalProps = {
  pendingDeepLink: string;
};

export function DeepLinkModal({ pendingDeepLink }: DeepLinkModalProps) {
  const modalStack = useModalStack();

  const onClosePress = () => {
    modalStack.pop();
  };

  return (
    <BaseModal title="Deep link received:">
      <Spacer.Vertical size="small" />
      <View py="small" bg="secondary" rounded="medium" px="medium">
        <Text type="mono" numberOfLines={3}>
          {pendingDeepLink}
        </Text>
      </View>

      <Spacer.Vertical size="large" />

      <PackagersList />

      <Spacer.Vertical size="large" />

      <View>
        <Text>
          <Text weight="bold">Note: </Text>
          The next app you open will receive this link
        </Text>

        <Spacer.Vertical size="medium" />

        <Button.ScaleOnPressContainer
          bg="ghost"
          rounded="medium"
          border="ghost"
          onPress={onClosePress}>
          <View py="small" px="medium">
            <Button.Text size="large" align="center" weight="semibold" color="ghost">
              Go back
            </Button.Text>
          </View>
        </Button.ScaleOnPressContainer>
      </View>
    </BaseModal>
  );
}

function PackagersList() {
  const modalStack = useModalStack();
  const { data: devSessions = [], isFetching: isFetchingDevSessions } = useDevSessions();
  const { data: recentlyOpenedApps = [], isFetching: isFetchingApps } = useRecentlyOpenedApps();

  const isFetching = isFetchingDevSessions || isFetchingApps;

  const onPackagerPress = ({ url }: { url: string }) => {
    loadApp(url).catch((error) => {
      modalStack.push(() => <LoadAppErrorModal message={error.message} />);
    });
  };

  if (isFetching) {
    return <ActivityIndicator />;
  }

  const hasPackagers = devSessions.length > 0 || recentlyOpenedApps.length > 0;

  if (!hasPackagers) {
    return (
      <View>
        <Text size="large" weight="medium">
          Unable to find any packagers
        </Text>

        <Spacer.Vertical size="small" />
        <Text>Start a local development server with:</Text>
        <Spacer.Vertical size="small" />

        <View bg="secondary" border="default" rounded="medium" padding="medium">
          <Text type="mono">expo start</Text>
        </View>
      </View>
    );
  }

  return (
    <View>
      <Text size="large">Select an app to open it:</Text>
      <ScrollView style={{ maxHeight: 300 }}>
        <Spacer.Vertical size="medium" />
        {devSessions.length > 0 && (
          <>
            {devSessions.map((devSession, index, arr) => {
              const isLast = index === arr.length - 1;

              return (
                <View key={devSession.url}>
                  <PackagerRow
                    label={devSession.description}
                    onPress={() => onPackagerPress(devSession)}
                  />
                  {!isLast && <Divider />}
                </View>
              );
            })}
          </>
        )}

        {recentlyOpenedApps.length > 0 && (
          <>
            <Divider />
            {recentlyOpenedApps.map((app, index, arr) => {
              const isLast = index === arr.length - 1;
              return (
                <View key={app.url}>
                  <PackagerRow label={app.name} onPress={() => onPackagerPress(app)} />
                  {!isLast && <Divider />}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

type PackagerRowProps = {
  label: string;
  onPress: () => void;
};

function PackagerRow({ onPress, label }: PackagerRowProps) {
  return (
    <View rounded="medium">
      <Button.ScaleOnPressContainer bg="default" onPress={onPress}>
        <Row align="center" py="medium" px="small">
          <StatusIndicator size="small" status="success" />
          <Spacer.Horizontal size="small" />
          <Text>{label}</Text>
          <Spacer.Horizontal />
          <ChevronRightIcon />
        </Row>
      </Button.ScaleOnPressContainer>
    </View>
  );
}
