import dedent from 'dedent';
import { Divider, useExpoTheme, View } from 'expo-dev-client-components';
import * as React from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  ScrollView,
  View as RNView,
} from 'react-native';
import InfiniteScrollView from 'react-native-infinite-scroll-view';

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
      <RNView style={{ flex: 1, padding: 30, alignItems: 'center' }}>
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
        <RNView style={{ flex: 1, alignItems: 'center', paddingTop: 30 }}>
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

    return <RNView style={{ flex: 1 }} />;
  }

  return <ProjectListView {...props} />;
}

function ProjectListView({ data, loadMoreAsync }: Props) {
  const isLoading = React.useRef<null | boolean>(false);

  const extractKey = React.useCallback((item) => item.id, []);

  const handleLoadMoreAsync = async () => {
    if (isLoading.current) return;
    isLoading.current = true;

    try {
      await loadMoreAsync();
    } catch (e) {
      console.error(e);
    } finally {
      isLoading.current = false;
    }
  };

  const currentAppCount = data.apps?.length ?? 0;
  const totalAppCount = data.appCount ?? 0;
  const canLoadMore = currentAppCount < totalAppCount;

  const renderItem: ListRenderItem<CommonAppDataFragment> = ({ item: app }) => {
    return (
      <ProjectsListItem
        key={app.id}
        id={app.id}
        name={app.name}
        imageURL={app.iconUrl || undefined}
        subtitle={app.packageName || app.fullName}
        sdkVersion={app.sdkVersion}
      />
    );
  };

  return (
    <View flex="1" padding="medium">
      <View overflow="hidden" bg="default" border="hairline" rounded="large">
        <FlatList
          data={data.apps}
          keyExtractor={extractKey}
          renderItem={renderItem}
          ItemSeparatorComponent={Divider}
          renderScrollComponent={(props: React.ComponentProps<typeof InfiniteScrollView>) => {
            // note(brent): renderScrollComponent is passed on to
            // InfiniteScrollView so it renders itself again and the result is two
            // loading indicators. So we need to detect if we're in
            // InfiniteScrollView by checking for a prop that is passed in to it,
            // in this case we'll just check for props.renderLoadingIndicator.
            // This should be fixed upstream in InfiniteScrollView, so if InfiniteScrollView
            // is itself the scroll component being rendered it doesn't once again render
            // the scroll component.
            if (props.renderLoadingIndicator) {
              return <ScrollView {...props} />;
            } else {
              return <InfiniteScrollView {...props} />;
            }
          }}
          // @ts-expect-error typescript cannot infer that props should include infinite-scroll-view props
          canLoadMore={canLoadMore}
          onLoadMoreAsync={handleLoadMoreAsync}
        />
      </View>
    </View>
  );
}
