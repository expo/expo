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
  ChevronDownIcon,
} from 'expo-dev-client-components';
import * as React from 'react';
import { ScrollView } from 'react-native';

import { AppHeader } from '../components/redesign/AppHeader';
import { PulseIndicator } from '../components/redesign/PulseIndicator';
import { UrlDropdown } from '../components/redesign/UrlDropdown';
import { TerminalIcon } from '../components/redesign/icons/TerminalIcon';
import { Packager } from '../functions/getLocalPackagersAsync';
import { useAppInfo } from '../hooks/useAppInfo';
import { useLocalPackagers } from '../hooks/useLocalPackagers';
import { loadApp } from '../native-modules/DevLauncherInternal';

export type HomeScreenProps = {
  fetchOnMount?: boolean;
  pollInterval?: number;
  pollAmount?: number;
};

export function HomeScreen({
  fetchOnMount = true,
  pollInterval = 1000,
  pollAmount = 5,
}: HomeScreenProps) {
  const { data, pollAsync, isFetching } = useLocalPackagers();
  const { appName, appIcon } = useAppInfo();

  const initialPackagerData = React.useRef(data);

  React.useEffect(() => {
    if (initialPackagerData.current.length === 0 && fetchOnMount) {
      pollAsync({ pollAmount, pollInterval });
    }
  }, [fetchOnMount, pollInterval, pollAmount]);

  const onPackagerPress = async (packager: Packager) => {
    await loadApp(packager.url);
  };

  const onUrlSubmit = async (url: string) => {
    await loadApp(url);
  };

  const onRefetchPress = () => {
    pollAsync({ pollAmount, pollInterval });
  };

  return (
    <ScrollView>
      <View bg="default">
        <AppHeader title={appName} appImageUri={appIcon} subtitle="Development App" />
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
          <View bg="default" rounded="large">
            {data?.length > 0 ? (
              <LocalPackagersList packagers={data} onPackagerPress={onPackagerPress} />
            ) : (
              <>
                <View padding="medium">
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
    <Button onPress={onRefetchPress} disabled={isFetching}>
      <Row align="center" padding="medium">
        <PulseIndicator isActive={isFetching} color={backgroundColor} />
        <Spacer.Horizontal size="small" />
        <Text size="large">
          {isFetching ? 'Searching for local servers...' : 'Refetch local servers'}
        </Text>
        <Spacer.Horizontal size="flex" />
        {!isFetching && <RefreshIcon size={16} />}
      </Row>
    </Button>
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
            <Button onPress={() => onPackagerPress(packager)}>
              <Row align="center" padding="medium">
                <StatusIndicator size="small" status="success" />
                <Spacer.Horizontal size="small" />
                <Text>{packager.description}</Text>
                <Spacer.Horizontal size="flex" />
                <ChevronDownIcon style={{ transform: [{ rotate: '-90deg' }] }} />
              </Row>
            </Button>
            <Divider />
          </View>
        );
      })}
    </View>
  );
}
