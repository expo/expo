import { spacing } from '@expo/styleguide-native';
import { Divider, useExpoTheme, View } from 'expo-dev-client-components';
import * as React from 'react';
import { FlatList, ActivityIndicator, View as RNView } from 'react-native';

import { SnacksListItem } from '../../components/SnacksListItem';
import { CommonSnackDataFragment } from '../../graphql/types';

type Props = {
  data: CommonSnackDataFragment[];
  loadMoreAsync: () => Promise<any>;
};

export function SnackListView(props: Props) {
  const [isReady, setReady] = React.useState(false);
  const theme = useExpoTheme();

  React.useEffect(() => {
    const _readyTimer = setTimeout(() => {
      setReady(true);
    }, 500);
    return () => {
      clearTimeout(_readyTimer);
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
        <ActivityIndicator />
      </RNView>
    );
  }

  if (!props.data?.length) {
    return <RNView style={{ flex: 1, backgroundColor: theme.background.screen }} />;
  }

  return <SnackList {...props} />;
}

const extractKey = (item: CommonSnackDataFragment) => item.id;

function SnackList({ data, loadMoreAsync }: Props) {
  const isLoading = React.useRef<null | boolean>(false);
  const theme = useExpoTheme();

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

  const renderItem = React.useCallback(
    ({ item: snack, index }: { item: CommonSnackDataFragment; index: number }) => {
      console.log(snack.fullName);
      console.log(snack);
      return (
        <SnacksListItem
          key={snack.id}
          id={snack.id}
          fullName={snack.fullName}
          name={snack.name}
          sdkVersion={snack.sdkVersion}
          description={snack.description}
          isDraft={snack.isDraft}
          first={index === 0}
          last={index === data.length - 1}
        />
      );
    },
    [data]
  );

  return (
    <View
      flex="1"
      style={{
        backgroundColor: theme.background.screen,
      }}>
      <FlatList
        data={data}
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
