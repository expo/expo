import { Heading, Text, Divider, Row, Spacer, View } from 'expo-dev-client-components';
import * as React from 'react';
import { ScrollView } from 'react-native';

import { AppHeader } from '../components/redesign/AppHeader';
import { FetchLocalPackagersRow } from '../components/redesign/FetchLocalPackagersRow';
import { LocalPackagersList } from '../components/redesign/LocalPackagersList';
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
