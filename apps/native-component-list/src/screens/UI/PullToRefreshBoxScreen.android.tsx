import { PullToRefreshBox, Host, LazyColumn, ListItem, Text } from '@expo/ui/jetpack-compose';
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
    <Host matchContents={{ horizontal: true }} style={{ height: '100%' }}>
      <PullToRefreshBox
        isRefreshing={basic.refreshing}
        onRefresh={basic.onRefresh}
        contentAlignment="topCenter">
        <LazyColumn modifiers={[fillMaxSize()]}>
          <ListItem>
            <ListItem.HeadlineContent>
              <Text>Item 1</Text>
            </ListItem.HeadlineContent>
          </ListItem>
          <ListItem>
            <ListItem.HeadlineContent>
              <Text>Item 2</Text>
            </ListItem.HeadlineContent>
          </ListItem>
          <ListItem>
            <ListItem.HeadlineContent>
              <Text>Item 3</Text>
            </ListItem.HeadlineContent>
          </ListItem>
          <ListItem>
            <ListItem.HeadlineContent>
              <Text>Item 4</Text>
            </ListItem.HeadlineContent>
          </ListItem>
          <ListItem>
            <ListItem.HeadlineContent>
              <Text>Item 5</Text>
            </ListItem.HeadlineContent>
          </ListItem>
        </LazyColumn>
      </PullToRefreshBox>
    </Host>
  );
}

PullToRefreshBoxScreen.navigationOptions = {
  title: 'PullToRefreshBox',
};
