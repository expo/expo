import {
  Column,
  Host,
  Icon,
  IconButton,
  Text as ComposeText,
  TopAppBar,
  useMaterialColors,
} from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';

const closeIcon = require('../../../assets/icons/ui/close.xml');
const editIcon = require('../../../assets/icons/ui/edit.xml');
const addIcon = require('../../../assets/icons/ui/add.xml');

export default function TopAppBarScreen() {
  const [count, setCount] = React.useState(0);

  return (
    <Host style={{ flex: 1 }}>
      <Column verticalArrangement={{ spacedBy: 24 }} modifiers={[fillMaxWidth()]}>
        <TopAppBar windowInsets={{}} modifiers={[fillMaxWidth()]}>
          <TopAppBar.Title>
            <ComposeText style={{ typography: 'titleLarge' }}>Default colors</ComposeText>
          </TopAppBar.Title>
        </TopAppBar>
        <ColoredTopAppBar count={count} onAdd={() => setCount(count + 1)} />
        <ComposeText modifiers={[padding(16, 0, 16, 0)]}>Add pressed {count} times.</ComposeText>
      </Column>
    </Host>
  );
}

function ColoredTopAppBar({ count, onAdd }: { count: number; onAdd: () => void }) {
  const colors = useMaterialColors();
  return (
    <TopAppBar
      windowInsets={{}}
      colors={{
        containerColor: colors.primaryContainer,
        navigationIconContentColor: colors.onPrimaryContainer,
        titleContentColor: colors.onPrimaryContainer,
        actionIconContentColor: colors.onPrimaryContainer,
      }}
      modifiers={[fillMaxWidth()]}>
      <TopAppBar.NavigationIcon>
        <IconButton onClick={() => console.log('Close')}>
          <Icon source={closeIcon} contentDescription="Close" />
        </IconButton>
      </TopAppBar.NavigationIcon>
      <TopAppBar.Title>
        <ComposeText style={{ typography: 'titleLarge' }}>Custom colors ({count})</ComposeText>
      </TopAppBar.Title>
      <TopAppBar.Actions>
        <IconButton onClick={() => console.log('Edit')}>
          <Icon source={editIcon} contentDescription="Edit" />
        </IconButton>
        <IconButton onClick={onAdd}>
          <Icon source={addIcon} contentDescription="Add" />
        </IconButton>
      </TopAppBar.Actions>
    </TopAppBar>
  );
}

TopAppBarScreen.navigationOptions = {
  title: 'TopAppBar',
};
