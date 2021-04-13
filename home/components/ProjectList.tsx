import { useTheme } from '@react-navigation/native';
import dedent from 'dedent';
import * as React from 'react';
import { ActivityIndicator, FlatList, ScrollView, TouchableOpacity, View } from 'react-native';
import InfiniteScrollView from 'react-native-infinite-scroll-view';

import Colors from '../constants/Colors';
import SharedStyles from '../constants/SharedStyles';
import PrimaryButton from './PrimaryButton';
import ProjectListItem from './ProjectListItem';
import SectionHeader from './SectionHeader';
import { StyledText } from './Text';

const NETWORK_ERROR_TEXT = dedent`
  Your connection appears to be offline.
  Check back when you have a better connection.
`;

const SERVER_ERROR_TEXT = dedent`
  An unexpected server error has occurred.
  Sorry about this. We will resolve the issue as soon as quickly as possible.
`;

export type Project = {
  id: string;
  description: string;
  fullName: string;
  iconUrl: string;
  published: boolean; // legacy publishes
  lastPublishedTime: number;
  name: string;
  packageName: string;
  privacy: string;
  sdkVersion: string;
  username: string;
};

type Props = {
  data: { apps?: Project[]; appCount?: number };
  loadMoreAsync: () => Promise<any>;
  listTitle?: string;

  loading: boolean;
  error?: Error;
  refetch: () => Promise<unknown>;
};

export default function LoadingProjectList(props: Props) {
  const [isReady, setReady] = React.useState(false);
  const isRetrying = React.useRef<null | boolean>(false);

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
      <View style={{ flex: 1, padding: 30, alignItems: 'center' }}>
        <ActivityIndicator color={Colors.light.tintColor} />
      </View>
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
        <View style={{ flex: 1, alignItems: 'center', paddingTop: 30 }}>
          <StyledText
            style={SharedStyles.noticeDescriptionText}
            lightColor="rgba(36, 44, 58, 0.7)"
            darkColor="#ccc">
            {isConnectionError ? NETWORK_ERROR_TEXT : SERVER_ERROR_TEXT}
          </StyledText>

          <PrimaryButton plain onPress={refetchDataAsync} fallback={TouchableOpacity}>
            Try again
          </PrimaryButton>
        </View>
      );
    }

    return <View style={{ flex: 1 }} />;
  }

  return <ProjectList {...props} />;
}

function ProjectList({ data, loadMoreAsync, listTitle }: Props) {
  const theme = useTheme();
  const isLoading = React.useRef<null | boolean>(false);

  const extractKey = React.useCallback(item => item.id, []);

  const handleLoadMoreAsync = async () => {
    if (isLoading.current) return;
    isLoading.current = true;

    try {
      await loadMoreAsync();
    } catch (e) {
      console.log({ e });
    } finally {
      isLoading.current = false;
    }
  };

  const currentAppCount = data.apps?.length ?? 0;
  const totalAppCount = data.appCount ?? 0;
  const canLoadMore = currentAppCount < totalAppCount;

  const renderItem = ({ item: app, index }: { item: Project; index: number }) => {
    const experienceInfo = { id: app.id, username: app.username, slug: app.packageName };
    return (
      <ProjectListItem
        key={index.toString()}
        url={app.fullName}
        image={app.iconUrl || require('../assets/placeholder-app-icon.png')}
        title={app.name}
        subtitle={app.packageName || app.fullName}
        last={index === currentAppCount - 1}
        experienceInfo={experienceInfo}
        sdkVersion={app.sdkVersion}
      />
    );
  };

  const renderHeader = () => {
    return listTitle ? <SectionHeader title={listTitle} /> : <View />;
  };

  const style = React.useMemo(
    () => [{ flex: 1 }, { backgroundColor: theme.dark ? '#000' : Colors.light.greyBackground }],
    [theme]
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={data.apps}
        keyExtractor={extractKey}
        renderItem={renderItem}
        style={style}
        ListHeaderComponent={renderHeader}
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
  );
}
