import {
  Box,
  HorizontalFloatingToolbar,
  Host,
  Icon,
  IconButton,
  LazyColumn,
  ListItem,
} from '@expo/ui/jetpack-compose';
import { align, fillMaxSize, fillMaxWidth, offset } from '@expo/ui/jetpack-compose/modifiers';
import { Alert, StyleSheet } from 'react-native';

const addIcon = require('../../../assets/icons/ui/add.xml');
const editIcon = require('../../../assets/icons/ui/edit.xml');

const items = Array.from({ length: 30 }, (_, i) => ({
  id: String(i),
  title: `Item ${i + 1}`,
  subtitle: 'Scroll to see the toolbar hide and reappear',
}));

export default function HorizontalFloatingToolbarScreen() {
  return (
    <Host style={styles.host}>
      <Box modifiers={[fillMaxSize()]} floatingToolbarExitAlwaysScrollBehavior="bottom">
        <LazyColumn modifiers={[fillMaxSize()]}>
          {items.map((item) => (
            <ListItem
              key={item.id}
              headline={item.title}
              supportingText={item.subtitle}
              modifiers={[fillMaxWidth()]}
            />
          ))}
        </LazyColumn>

        <HorizontalFloatingToolbar
          variant="vibrant"
          modifiers={[align('bottomCenter'), offset(0, -16)]}>
          <HorizontalFloatingToolbar.FloatingActionButton
            onPress={() => Alert.alert('FAB pressed')}>
            <Icon source={addIcon} />
          </HorizontalFloatingToolbar.FloatingActionButton>
          <IconButton onClick={() => Alert.alert('Edit pressed')}>
            <Icon source={editIcon} />
          </IconButton>
          <IconButton onClick={() => Alert.alert('Add pressed')}>
            <Icon source={addIcon} />
          </IconButton>
        </HorizontalFloatingToolbar>
      </Box>
    </Host>
  );
}

HorizontalFloatingToolbarScreen.navigationOptions = {
  title: 'HorizontalFloatingToolbar',
};

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
});
