import * as React from 'react';
import { ScrollView } from 'react-native';

import { AppHeader } from '../components/redesign/AppHeader';
import { FetchLocalPackagersRow } from '../components/redesign/FetchLocalPackagersRow';
import { LocalPackagersList } from '../components/redesign/LocalPackagersList';
import { TerminalIcon } from '../components/redesign/TerminalIcon';
import { Heading, Text } from '../components/redesign/Text';
import { UrlDropdown } from '../components/redesign/UrlDropdown';
import { Divider, Row, Spacer, View } from '../components/redesign/View';
import { Packager } from '../functions/getLocalPackagersAsync';
import { useLocalPackagers } from '../hooks/useLocalPackagers';
import { loadApp, getAppInfoAsync, AppInfo } from '../native-modules/DevLauncherInternal';

export type HomeScreenProps = {
  refetchPollInterval?: number;
  refetchPollAmount?: number;
};

export function HomeScreen({ refetchPollAmount = 5, refetchPollInterval = 1000 }: HomeScreenProps) {
  const { data, pollAsync, isFetching } = useLocalPackagers();

  const [appInfo, setAppInfo] = React.useState<AppInfo>({
    appName: '',
    appVersion: -1,
    appIcon: '',
    hostUrl: '',
  });

  React.useEffect(() => {
    getAppInfoAsync().then(setAppInfo);
  }, []);

  const onPackagerPress = async (packager: Packager) => {
    await loadApp(packager.url);
  };

  const onUrlSubmit = async (url: string) => {
    await loadApp(url);
  };

  const onRefetchPress = () => {
    pollAsync({ pollAmount: refetchPollAmount, pollInterval: refetchPollInterval });
  };

  return (
    <ScrollView>
      <View bg="default">
        <AppHeader
          title={appInfo?.appName}
          appImageUri={appInfo?.appIcon}
          subtitle="Development App"
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
