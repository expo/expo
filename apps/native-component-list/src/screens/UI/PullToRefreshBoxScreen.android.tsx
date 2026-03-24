import { PullToRefreshBox, Host, LazyColumn, ListItem } from '@expo/ui/jetpack-compose';
import { fillMaxSize } from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';

function useSimulatedRefresh() {
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  return { refreshing, onRefresh };
}

export default function PullToRefreshBoxScreen() {
  const basic = useSimulatedRefresh();

  return (
    <Host matchContents>
      <PullToRefreshBox
        isRefreshing={basic.refreshing}
        onRefresh={basic.onRefresh}
        contentAlignment="topCenter">
        <LazyColumn modifiers={[fillMaxSize()]}>
          <ListItem headline="Item 1" />
          <ListItem headline="Item 2" />
          <ListItem headline="Item 3" />
          <ListItem headline="Item 4" />
          <ListItem headline="Item 5" />
        </LazyColumn>
      </PullToRefreshBox>
    </Host>
  );
}

PullToRefreshBoxScreen.navigationOptions = {
  title: 'PullToRefreshBox',
};
