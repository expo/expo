import {
  View,
  Heading,
  Text,
  Row,
  XIcon,
  Spacer,
  Button,
  StatusIndicator,
  ChevronRightIcon,
  Divider,
} from 'expo-dev-client-components';
import * as React from 'react';
import { ActivityIndicator, Alert, ScrollView } from 'react-native';

import { useDevSessions } from '../../hooks/useDevSessions';
import { useModalStack } from '../../hooks/useModalStack';
import { useRecentlyOpenedApps } from '../../hooks/useRecentlyOpenedApps';
import { loadApp } from '../../native-modules/DevLauncherInternal';
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
    <View>
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

      <Spacer.Vertical size="large" />
    </View>
  );
}

function PackagersList() {
  const modalStack = useModalStack();
  const { data: devSessions = [], isFetching: isFetchingDevSessions } = useDevSessions();
  const { data: recentlyOpenedApps = [], isFetching: isFetchingApps } = useRecentlyOpenedApps();

  const isFetching = isFetchingDevSessions || isFetchingApps;

  const onPackagerPress = ({ url }: { url: string }) => {
    loadApp(url).catch((error) => {
      modalStack.push({
        title: 'Error loading app',
        element: <LoadAppErrorModal message={error.message} />,
      });
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
        <Text size="medium">Start a local development server with:</Text>
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
            {devSessions.map((devSession) => {
              return (
                <PackagerRow
                  key={devSession.url}
                  label={devSession.description}
                  onPress={() => onPackagerPress(devSession)}
                />
              );
            })}
          </>
        )}

        {recentlyOpenedApps.length > 0 && (
          <>
            {recentlyOpenedApps.map((app) => {
              return (
                <PackagerRow key={app.url} label={app.name} onPress={() => onPackagerPress(app)} />
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
          <Spacer.Horizontal size="flex" />
          <ChevronRightIcon />
        </Row>
      </Button.ScaleOnPressContainer>
      <Divider />
    </View>
  );
}
