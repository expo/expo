import { spacing } from '@expo/styleguide-native';
import dedent from 'dedent';
import { Divider, useExpoTheme, View } from 'expo-dev-client-components';
import * as React from 'react';
import { FlatList, ActivityIndicator, ListRenderItem, View as RNView } from 'react-native';

import PrimaryButton from '../../components/PrimaryButton';
import { ProjectsListItem } from '../../components/ProjectsListItem';
import { StyledText } from '../../components/Text';
import SharedStyles from '../../constants/SharedStyles';
import { CommonAppDataFragment } from '../../graphql/types';

const NETWORK_ERROR_TEXT = dedent`
  Your connection appears to be offline.
  Check back when you have a better connection.
`;

const SERVER_ERROR_TEXT = dedent`
  An unexpected server error has occurred.
  Sorry about this. We will resolve the issue as soon as quickly as possible.
`;

type Props = {
  data: { apps?: CommonAppDataFragment[]; appCount?: number };
  loadMoreAsync: () => Promise<any>;
  loading: boolean;
  error?: Error;
  refetch: () => Promise<unknown>;
};

export function ProjectList(props: Props) {
  const [isReady, setReady] = React.useState(false);
  const isRetrying = React.useRef<null | boolean>(false);

  const theme = useExpoTheme();

  React.useEffect(() => {
    const readyTimer = setTimeout(() => {
      setReady(true);
    }, 500);
    return () => {
      clearTimeout(readyTimer);
    };
  }, []);

  if (!isReady) {
    return (
      <RNView
        style={{
          flex: 1,
          padding: 30,
          alignItems: 'center',
          backgroundColor: theme.background.screen,
        }}>
        <ActivityIndicator color={theme.highlight.accent} />
      </RNView>
    );
  }

  if (!props.data?.apps?.length) {
    if (!props.loading && props.error) {
      // Error
      // NOTE(brentvatne): sorry for this
      const isConnectionError = props.error.message.includes('No connection available');

      const refetchDataAsync = async () => {
        if (isRetrying.current) return;
        isRetrying.current = true;
        try {
          await props.refetch();
        } catch (e) {
          console.log({ e });
          // Error!
        } finally {
          isRetrying.current = false;
        }
      };

      return (
        <RNView
          style={{
            flex: 1,
            alignItems: 'center',
            paddingTop: 30,
            backgroundColor: theme.background.screen,
          }}>
          <StyledText
            style={SharedStyles.noticeDescriptionText}
            lightColor="rgba(36, 44, 58, 0.7)"
            darkColor="#ccc">
            {isConnectionError ? NETWORK_ERROR_TEXT : SERVER_ERROR_TEXT}
          </StyledText>

          <PrimaryButton plain onPress={refetchDataAsync}>
            Try again
          </PrimaryButton>
        </RNView>
      );
    }

    return <RNView style={{ flex: 1, backgroundColor: theme.background.screen }} />;
  }

  return <ProjectListView {...props} />;
}

function ProjectListView({ data, loadMoreAsync }: Props) {
  const isLoading = React.useRef<null | boolean>(false);
  const theme = useExpoTheme();
  const extractKey = (item: CommonAppDataFragment) => item.id;

  const currentAppCount = data.apps?.length ?? 0;
  const totalAppCount = data.appCount ?? 0;
  const canLoadMore = currentAppCount < totalAppCount;

  const handleLoadMoreAsync = async () => {
    if (isLoading.current || !canLoadMore) return;
    isLoading.current = true;

    try {
      await loadMoreAsync();
    } catch (e) {
      console.error(e);
    } finally {
      isLoading.current = false;
    }
  };

  const renderItem: ListRenderItem<CommonAppDataFragment> = React.useCallback(
    ({ item: app, index }) => {
      return (
        <ProjectsListItem
          key={app.id}
          id={app.id}
          name={app.name}
          firstTwoBranches={app.firstTwoBranches}
          subtitle={app.fullName}
          first={index === 0}
          last={index === (data.apps ?? []).length - 1}
        />
      );
    },
    [data.apps]
  );

  return (
    <View
      flex="1"
      style={{
        backgroundColor: theme.background.screen,
      }}>
      <FlatList
        data={data.apps}
        keyExtractor={extractKey}
        renderItem={renderItem}
        contentContainerStyle={{ padding: spacing[4] }}
        ItemSeparatorComponent={() => <Divider style={{ height: 1 }} />}
        onEndReachedThreshold={0.2}
        onEndReached={handleLoadMoreAsync}
      />
    </View>
  );
}
