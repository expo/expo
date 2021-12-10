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
} from 'expo-dev-client-components';
import * as React from 'react';
import { ScrollView } from 'react-native';

import { AppHeader } from '../components/redesign/AppHeader';
import { PulseIndicator } from '../components/redesign/PulseIndicator';
import { UrlDropdown } from '../components/redesign/UrlDropdown';
import { Packager } from '../functions/getLocalPackagersAsync';
import { useAppInfo } from '../hooks/useAppInfo';
import { useLocalPackagers } from '../hooks/useLocalPackagers';
import { loadApp, getRecentlyOpenedApps } from '../native-modules/DevLauncherInternal';

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
  const { data, pollAsync, isFetching } = useLocalPackagers();

  React.useEffect(() => {
    getRecentlyOpenedApps().then((response) => {
      console.log({ response });
    });
  }, []);

  const appInfo = useAppInfo();
  const { appName, appIcon } = appInfo;

  const initialPackagerData = React.useRef(data);

  React.useEffect(() => {
    if (initialPackagerData.current.length === 0 && fetchOnMount) {
      pollAsync({ pollAmount, pollInterval });
    }
  }, [fetchOnMount, pollInterval, pollAmount, pollAsync]);

  const onPackagerPress = async (packager: Packager) => {
    await loadApp(packager.url);
  };

  const onUrlSubmit = async (url: string) => {
    await loadApp(url);
  };

  const onRefetchPress = () => {
    pollAsync({ pollAmount, pollInterval });
  };

  const onUserProfilePress = () => {
    navigation.navigate('User Profile');
  };

  const onAppPress = async (url: string) => {
    await loadApp(url);
  };

  return (
    <ScrollView>
      <View bg="default">
        <AppHeader
          title={appName}
          appImageUri={appIcon}
          subtitle="Development App"
          onUserProfilePress={onUserProfilePress}
        />
      </View>

      <View py="large">
        <Row px="medium" align="center">
          <View px="small">
            <TerminalIcon />
          </View>
          <Heading size="small" color="secondary">
            Development servers
          </Heading>
        </Row>

        <Spacer.Vertical size="small" />

        <View px="medium">
          <View>
            {data?.length > 0 ? (
              <LocalPackagersList packagers={data} onPackagerPress={onPackagerPress} />
            ) : (
              <>
                <View padding="medium" bg="default" roundedTop="large">
                  <Text size="medium">Start a local development server with:</Text>
                  <Spacer.Vertical size="small" />

                  <View bg="secondary" border="default" rounded="medium" padding="medium">
                    <Text type="mono">expo start</Text>
                  </View>

                  <Spacer.Vertical size="small" />
                  <Text size="medium">Then, select the local server when it appears here.</Text>
                </View>
                <Divider />
              </>
            )}

            <FetchLocalPackagersRow isFetching={isFetching} onRefetchPress={onRefetchPress} />

            <Divider />

            <UrlDropdown onSubmit={onUrlSubmit} />
          </View>
        </View>

        <Spacer.Vertical size="medium" />

        <RecentlyOpenedApps onAppPress={onAppPress} />
      </View>
    </ScrollView>
  );
}

type FetchLocalPackagersRowProps = {
  isFetching: boolean;
  onRefetchPress: () => void;
};

function FetchLocalPackagersRow({ isFetching, onRefetchPress }: FetchLocalPackagersRowProps) {
  const theme = useExpoTheme();
  const backgroundColor = isFetching ? theme.status.info : theme.status.default;

  return (
    <Button.ScaleOnPressContainer onPress={onRefetchPress} disabled={isFetching} bg="default">
      <Row align="center" padding="medium">
        <PulseIndicator isActive={isFetching} color={backgroundColor} />
        <Spacer.Horizontal size="small" />
        <Button.Text size="large" color="default">
          {isFetching ? 'Searching for local servers...' : 'Refetch local servers'}
        </Button.Text>
        <Spacer.Horizontal size="flex" />
        {!isFetching && <RefreshIcon />}
      </Row>
    </Button.ScaleOnPressContainer>
  );
}

type LocalPackagersListProps = {
  packagers?: Packager[];
  onPackagerPress: (packager: Packager) => void;
};

function LocalPackagersList({ packagers = [], onPackagerPress }: LocalPackagersListProps) {
  if (packagers.length === 0) {
    return null;
  }

  return (
    <View>
      {packagers.map((packager) => {
        return (
          <View key={packager.description}>
            <Button.ScaleOnPressContainer
              onPress={() => onPackagerPress(packager)}
              roundedTop="large"
              roundedBottom="none"
              bg="default">
              <Row align="center" padding="medium">
                <StatusIndicator size="small" status="success" />
                <Spacer.Horizontal size="small" />
                <Button.Text color="default">{packager.description}</Button.Text>
                <Spacer.Horizontal size="flex" />
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
  const [apps, setApps] = React.useState([]);

  React.useEffect(() => {
    getRecentlyOpenedApps().then((apps) => {
      const formattedApps = Object.entries(apps).map(([url, name]) => {
        return {
          url,
          name,
        };
      });

      setApps(formattedApps);
    });
  }, []);

  if (apps.length === 0) {
    return null;
  }

  return (
    <View px="medium">
      <View padding="medium">
        <Heading size="small" color="secondary">
          Recently opened
        </Heading>
      </View>

      <View>
        {apps.map((app, index, arr) => {
          const isFirst = index === 0;
          const isLast = index === arr.length - 1;
          const label = app.name ?? app.url;

          return (
            <View key={label}>
              <Button.ScaleOnPressContainer
                onPress={() => onAppPress(app.url)}
                roundedTop={isFirst ? 'large' : 'none'}
                roundedBottom={isLast ? 'large' : 'none'}
                bg="default">
                <Row align="center" padding="medium">
                  <StatusIndicator size="small" status="success" />
                  <Spacer.Horizontal size="small" />
                  <Button.Text color="default">{label}</Button.Text>
                  <Spacer.Horizontal size="flex" />
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
