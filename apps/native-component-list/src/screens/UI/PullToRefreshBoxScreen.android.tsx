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
          <ListItem>
            <ListItem.HeadlineContent>Item 1</ListItem.HeadlineContent>
          </ListItem>
          <ListItem>
            <ListItem.HeadlineContent>Item 2</ListItem.HeadlineContent>
          </ListItem>
          <ListItem>
            <ListItem.HeadlineContent>Item 3</ListItem.HeadlineContent>
          </ListItem>
          <ListItem>
            <ListItem.HeadlineContent>Item 4</ListItem.HeadlineContent>
          </ListItem>
          <ListItem>
            <ListItem.HeadlineContent>Item 5</ListItem.HeadlineContent>
          </ListItem>
        </LazyColumn>
      </PullToRefreshBox>
    </Host>
  );
}

PullToRefreshBoxScreen.navigationOptions = {
  title: 'PullToRefreshBox',
};
