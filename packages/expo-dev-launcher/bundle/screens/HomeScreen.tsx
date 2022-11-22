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
  useExpoPalette,
  BranchIcon,
} from 'expo-dev-client-components';
import * as React from 'react';
import { Animated, ScrollView, KeyboardAvoidingView } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { DevServerExplainerModal } from '../components/DevServerExplainerModal';
import { useLoadingContainerStyle } from '../components/EASUpdatesRows';
import { LoadAppErrorModal } from '../components/LoadAppErrorModal';
import { PulseIndicator } from '../components/PulseIndicator';
import { ScreenContainer } from '../components/ScreenContainer';
import { Toasts } from '../components/Toasts';
import { UrlDropdown } from '../components/UrlDropdown';
import { formatUpdateUrl } from '../functions/formatUpdateUrl';
import { loadApp, loadUpdate } from '../native-modules/DevLauncherInternal';
import { useCrashReport } from '../providers/CrashReportProvider';
import { useDevSessions } from '../providers/DevSessionsProvider';
import { useModalStack } from '../providers/ModalStackProvider';
import { RecentApp, useRecentlyOpenedApps } from '../providers/RecentlyOpenedAppsProvider';
import { useToastStack } from '../providers/ToastStackProvider';
import { useUpdatesConfig } from '../providers/UpdatesConfigProvider';
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
  const [inputValue, setInputValue] = React.useState('');
  const [loadingUrl, setLoadingUrl] = React.useState('');

  const { data: devSessions, pollAsync, isFetching } = useDevSessions();
  const toastStack = useToastStack();
  const { projectUrl } = useUpdatesConfig();

  const crashReport = useCrashReport();

  const initialDevSessionData = React.useRef(devSessions);

  React.useEffect(() => {
    if (initialDevSessionData.current.length === 0 && fetchOnMount) {
      pollAsync({ pollAmount, pollInterval });
    }
  }, [fetchOnMount, pollInterval, pollAmount, pollAsync]);

  const onLoadUrl = async (url: string) => {
    setLoadingUrl(url);

    await loadApp(url).catch((error) => {
      setLoadingUrl('');
      modalStack.push(() => <LoadAppErrorModal message={error.message} />);
    });

    setLoadingUrl('');
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

  const onRecentAppPress = async (app: RecentApp) => {
    if (app.isEASUpdate) {
      const updateUrl = formatUpdateUrl(app.url, app.updateMessage);
      loadUpdate(updateUrl, projectUrl).catch((error) => {
        toastStack.push(() => <Toasts.Error>{error.message}</Toasts.Error>, {
          durationMs: 10000,
        });
      });
    } else {
      onLoadUrl(app.url);
    }
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
      <ScrollView
        style={{}}
        contentContainerStyle={{
          paddingBottom: scale['48'],
        }}>
        <ScreenContainer>
          <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
            {crashReport && (
              <View px="medium" py="small" mt="small">
                <Button.ScaleOnPressContainer
                  onPress={onCrashReportPress}
                  bg="default"
                  rounded="large">
                  <Row align="center" padding="medium" bg="default">
                    <Button.Text color="default">
                      The last time you tried to open an app the development build crashed. Tap to
                      get more information.
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
                          Alternatively, open the Camera app and scan the QR code that appears in
                          your terminal
                        </Text>
                      </View>
                      <Divider />
                    </>
                  )}

                  {devSessions?.length > 0 && (
                    <DevSessionList
                      devSessions={devSessions}
                      onDevSessionPress={onDevSessionPress}
                    />
                  )}

                  <FetchDevSessionsRow isFetching={isFetching} onRefetchPress={onRefetchPress} />
                  <Divider />

                  <UrlDropdown
                    onSubmit={onUrlSubmit}
                    inputValue={inputValue}
                    setInputValue={setInputValue}
                    isLoading={inputValue !== '' && inputValue === loadingUrl}
                  />
                </View>
              </View>

              <Spacer.Vertical size="medium" />

              <RecentlyOpenedApps onRecentAppPress={onRecentAppPress} loadingUrl={loadingUrl} />
            </View>
          </KeyboardAvoidingView>
        </ScreenContainer>
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

function RecentlyOpenedApps({ onRecentAppPress, loadingUrl }) {
  const { data: apps, clear: clearRecentlyOpenedApps } = useRecentlyOpenedApps();

  if (apps.length === 0) {
    return null;
  }

  function renderRow(app: RecentApp) {
    const label = app.name ?? app.url;

    if (app.isEASUpdate && app.updateMessage != null) {
      return (
        <RecentEASUpdateRow
          label={label}
          url={app.url}
          message={app.updateMessage}
          branchName={app.branchName}
        />
      );
    }

    return <RecentLocalPackagerRow label={label} url={app.url} />;
  }

  return (
    <View px="medium">
      <Row align="center" py="small">
        <Spacer.Horizontal size="small" />

        <Heading color="secondary">Recently opened</Heading>
        <Spacer.Horizontal />

        <Button.ScaleOnPressContainer bg="ghost" onPress={clearRecentlyOpenedApps}>
          <View rounded="medium" px="small" py="micro">
            <Heading size="small" weight="semibold" color="secondary">
              Reset
            </Heading>
          </View>
        </Button.ScaleOnPressContainer>
      </Row>

      <View>
        {apps.map((app, index, arr) => {
          const isFirst = index === 0;
          const isLast = index === arr.length - 1;
          const isLoading = app.url === loadingUrl;

          return (
            <LoadingContainer key={app.id} isLoading={isLoading}>
              <Button.ScaleOnPressContainer
                onPress={() => onRecentAppPress(app)}
                roundedTop={isFirst ? 'large' : 'none'}
                roundedBottom={isLast ? 'large' : 'none'}
                py="small"
                bg="default">
                {renderRow(app)}
              </Button.ScaleOnPressContainer>
              {!isLast && <Divider />}
            </LoadingContainer>
          );
        })}
      </View>
    </View>
  );
}

function LoadingContainer({ children, isLoading }) {
  const style = useLoadingContainerStyle(isLoading);
  return <Animated.View style={style}>{children}</Animated.View>;
}

function RecentLocalPackagerRow({ label, url }) {
  return (
    <>
      <Row align="center" px="medium" bg="default">
        <StatusIndicator size="small" status="success" />
        <Spacer.Horizontal size="small" />
        <View flex="1">
          <Button.Text color="default" numberOfLines={1}>
            {label}
          </Button.Text>
        </View>
        <ChevronRightIcon />
      </Row>

      <Row px="medium" align="center" bg="default">
        <Spacer.Vertical size="tiny" />
        <Spacer.Horizontal size="large" />
        <Row
          style={{
            flexWrap: 'wrap',
            flexShrink: 1,
          }}>
          <Text size="small" color="secondary" numberOfLines={1}>
            {url}
          </Text>
        </Row>
      </Row>
    </>
  );
}

function RecentEASUpdateRow({ label, url, branchName, message }) {
  const palette = useExpoPalette();
  return (
    <View>
      <Row align="center" px="medium" bg="default">
        <Row
          shrink="1"
          style={{
            backgroundColor: palette.blue['100'],
          }}
          py="tiny"
          px="1.5"
          rounded="medium"
          align="center">
          <BranchIcon
            style={{ maxHeight: 10, maxWidth: 12, resizeMode: 'contain' }}
            resizeMethod="scale"
          />
          <Spacer.Horizontal size="tiny" />
          <View shrink="1">
            <Text size="small" numberOfLines={1}>{`Branch: ${branchName}`}</Text>
          </View>
        </Row>

        <Spacer.Horizontal />

        <ChevronRightIcon />
      </Row>

      <Spacer.Vertical size="small" bg="default" />

      {Boolean(message) && (
        <>
          <Row px="medium" align="center" bg="default">
            <View>
              <Heading size="small" numberOfLines={1}>
                {`Update "${message}"`}
              </Heading>
            </View>
          </Row>

          <Spacer.Vertical size="micro" bg="default" />
        </>
      )}

      <Row px="medium" align="center" bg="default">
        <Row
          style={{
            flexWrap: 'wrap',
            flexShrink: 1,
          }}>
          <Text size="small" color="secondary" numberOfLines={1}>
            {url}
          </Text>
        </Row>
      </Row>
    </View>
  );
}
