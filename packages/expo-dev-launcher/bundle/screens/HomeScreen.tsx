import {
  Heading,
  Text,
  Divider,
  Row,
  Spacer,
  View,
  useExpoTheme,
  RefreshIcon,
  Button,
  StatusIndicator,
  TerminalIcon,
  ChevronRightIcon,
  InfoIcon,
  scale,
} from 'expo-dev-client-components';
import * as React from 'react';
import { ScrollView } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { DevServerExplainerModal } from '../components/DevServerExplainerModal';
import { LoadAppErrorModal } from '../components/LoadAppErrorModal';
import { PulseIndicator } from '../components/PulseIndicator';
import { UrlDropdown } from '../components/UrlDropdown';
import { loadApp } from '../native-modules/DevLauncherInternal';
import { useCrashReport } from '../providers/CrashReportProvider';
import { useDevSessions } from '../providers/DevSessionsProvider';
import { useModalStack } from '../providers/ModalStackProvider';
import { useRecentlyOpenedApps } from '../providers/RecentlyOpenedAppsProvider';
import { DevSession } from '../types';

export type HomeScreenProps = {
  fetchOnMount?: boolean;
  pollInterval?: number;
  pollAmount?: number;
  navigation?: any;
};

export function HomeScreen({
  fetchOnMount = false,
  pollInterval = 1000,
  pollAmount = 5,
  navigation,
}: HomeScreenProps) {
  const modalStack = useModalStack();
  const { data: devSessions, pollAsync, isFetching } = useDevSessions();

  const crashReport = useCrashReport();

  const initialDevSessionData = React.useRef(devSessions);

  React.useEffect(() => {
    if (initialDevSessionData.current.length === 0 && fetchOnMount) {
      pollAsync({ pollAmount, pollInterval });
    }
  }, [fetchOnMount, pollInterval, pollAmount, pollAsync]);

  const onLoadUrl = (url: string) => {
    loadApp(url).catch((error) => {
      modalStack.push(() => <LoadAppErrorModal message={error.message} />);
    });
  };

  const onDevSessionPress = async (devSession: DevSession) => {
    onLoadUrl(devSession.url);
  };

  const onUrlSubmit = async (url: string) => {
    onLoadUrl(url);
  };

  const onRefetchPress = () => {
    pollAsync({ pollAmount, pollInterval });
  };

  const onAppPress = async (url: string) => {
    onLoadUrl(url);
  };

  const onDevServerQuestionPress = () => {
    modalStack.push(() => <DevServerExplainerModal />);
  };

  const onCrashReportPress = () => {
    navigation.navigate('Crash Report', crashReport);
  };

  return (
    <View testID="DevLauncherMainScreen">
      <AppHeader navigation={navigation} />
      <ScrollView contentContainerStyle={{ paddingBottom: scale['48'] }}>
        {crashReport && (
          <View px="medium" py="small" mt="small">
            <Button.ScaleOnPressContainer onPress={onCrashReportPress} bg="default" rounded="large">
              <Row align="center" padding="medium" bg="default">
                <Button.Text color="default">
                  The last time you tried to open an app the development build crashed. Tap to get
                  more information.
                </Button.Text>
              </Row>
            </Button.ScaleOnPressContainer>
          </View>
        )}
        <View py="large">
          <Row px="small" align="center">
            <View px="medium">
              <TerminalIcon />
            </View>
            <Heading color="secondary">Development servers</Heading>

            <Spacer.Horizontal />

            {devSessions.length > 0 && (
              <Button.ScaleOnPressContainer
                bg="ghost"
                rounded="full"
                minScale={0.85}
                onPress={onDevServerQuestionPress}>
                <View rounded="full" padding="tiny">
                  <InfoIcon />
                </View>
              </Button.ScaleOnPressContainer>
            )}
          </Row>

          <Spacer.Vertical size="small" />

          <View px="medium">
            <View>
              {devSessions.length === 0 && (
                <>
                  <View padding="medium" bg="default" roundedTop="large">
                    <Text>Start a local development server with:</Text>
                    <Spacer.Vertical size="small" />

                    <View bg="secondary" border="default" rounded="medium" padding="medium">
                      <Text type="mono" size="small">
                        expo start --dev-client
                      </Text>
                    </View>

                    <Spacer.Vertical size="small" />
                    <Text>Then, select the local server when it appears here.</Text>
                    <Spacer.Vertical size="small" />
                    <Text>
                      Alternatively, open the Camera app and scan the QR code that appears in your
                      terminal
                    </Text>
                  </View>
                  <Divider />
                </>
              )}

              {devSessions?.length > 0 && (
                <DevSessionList devSessions={devSessions} onDevSessionPress={onDevSessionPress} />
              )}

              <FetchDevSessionsRow isFetching={isFetching} onRefetchPress={onRefetchPress} />
              <Divider />

              <UrlDropdown onSubmit={onUrlSubmit} />
            </View>
          </View>

          <Spacer.Vertical size="medium" />

          <RecentlyOpenedApps onAppPress={onAppPress} />
        </View>
      </ScrollView>
    </View>
  );
}

type FetchDevSessionsRowProps = {
  isFetching: boolean;
  onRefetchPress: () => void;
};

function FetchDevSessionsRow({ isFetching, onRefetchPress }: FetchDevSessionsRowProps) {
  const theme = useExpoTheme();
  const backgroundColor = isFetching ? theme.status.info : theme.status.default;

  return (
    <Button.ScaleOnPressContainer
      onPress={onRefetchPress}
      disabled={isFetching}
      bg="default"
      rounded="none">
      <Row align="center" padding="medium" bg="default">
        <View width="6">
          <PulseIndicator isActive={isFetching} color={backgroundColor} />
        </View>

        <Button.Text color="default">
          {isFetching ? 'Searching for development servers...' : 'Fetch development servers'}
        </Button.Text>
        <Spacer.Horizontal />
        {!isFetching && <RefreshIcon />}
      </Row>
    </Button.ScaleOnPressContainer>
  );
}

type DevSessionListProps = {
  devSessions?: DevSession[];
  onDevSessionPress: (devSession: DevSession) => void;
};

function DevSessionList({ devSessions = [], onDevSessionPress }: DevSessionListProps) {
  if (devSessions.length === 0) {
    return null;
  }

  return (
    <View>
      {devSessions.map((devSession) => {
        return (
          <View key={devSession.url}>
            <Button.ScaleOnPressContainer
              onPress={() => onDevSessionPress(devSession)}
              roundedTop="large"
              roundedBottom="none"
              bg="default">
              <Row align="center" padding="medium" bg="default">
                <StatusIndicator size="small" status="success" />
                <Spacer.Horizontal size="small" />
                <View flex="1">
                  <Button.Text color="default" numberOfLines={1}>
                    {devSession.description}
                  </Button.Text>
                </View>
                <Spacer.Horizontal size="small" />
                <ChevronRightIcon />
              </Row>
            </Button.ScaleOnPressContainer>
            <Divider />
          </View>
        );
      })}
    </View>
  );
}

function RecentlyOpenedApps({ onAppPress }) {
  const { data: apps } = useRecentlyOpenedApps();

  if (apps.length === 0) {
    return null;
  }

  return (
    <View px="medium">
      <View padding="medium">
        <Heading color="secondary">Recently opened</Heading>
      </View>

      <View>
        {apps.map((app, index, arr) => {
          const isFirst = index === 0;
          const isLast = index === arr.length - 1;
          const label = app.name ?? app.url;

          return (
            <View key={app.url}>
              <Button.ScaleOnPressContainer
                onPress={() => onAppPress(app.url)}
                roundedTop={isFirst ? 'large' : 'none'}
                roundedBottom={isLast ? 'large' : 'none'}
                bg="default">
                <Row align="center" padding="medium" bg="default">
                  <StatusIndicator size="small" status="success" />
                  <Spacer.Horizontal size="small" />
                  <View flex="1">
                    <Button.Text color="default" numberOfLines={1}>
                      {label}
                    </Button.Text>
                  </View>
                  <ChevronRightIcon />
                </Row>
              </Button.ScaleOnPressContainer>
              {!isLast && <Divider />}
            </View>
          );
        })}
      </View>
    </View>
  );
}
