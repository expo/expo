import {
  Box,
  Host,
  Icon,
  LazyColumn,
  ListItem,
  SwipeToDismissBox,
  Text as ComposeText,
} from '@expo/ui/jetpack-compose';
import {
  background,
  clip,
  fillMaxSize,
  fillMaxWidth,
  paddingAll,
  Shapes,
} from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';

const archiveIcon = require('../../../assets/icons/ui/archive.xml');
const deleteIcon = require('../../../assets/icons/ui/delete.xml');

export default function ListScreen() {
  const [deleteItems, setDeleteItems] = React.useState([
    { id: 'del1', title: 'Swipe left to delete', subtitle: 'End-to-start only' },
  ]);
  const [archiveItems, setArchiveItems] = React.useState([
    { id: 'arc1', title: 'Swipe right to archive', subtitle: 'Start-to-end only' },
  ]);
  const [biItems, setBiItems] = React.useState([
    { id: 'bi1', title: 'Swipe either way', subtitle: 'Left to delete, right to archive' },
  ]);

  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn modifiers={[fillMaxWidth()]}>
        {/* Swipe right-to-left to delete */}
        {deleteItems.map((item) => (
          <SwipeToDismissBox
            key={item.id}
            enableDismissFromStartToEnd={false}
            onEndToStart={() => setDeleteItems((prev) => prev.filter((i) => i.id !== item.id))}>
            <SwipeToDismissBox.BackgroundContent>
              <Box
                contentAlignment="center"
                modifiers={[
                  fillMaxSize(),
                  clip(Shapes.RoundedCorner(24)),
                  background('#EF5350'),
                  paddingAll(16),
                ]}>
                <Icon source={deleteIcon} size={24} tintColor="#FFFFFF" />
              </Box>
            </SwipeToDismissBox.BackgroundContent>
            <ListItem headline={item.title} modifiers={[fillMaxWidth()]}>
              <ListItem.SupportingContent>
                <ComposeText>{item.subtitle}</ComposeText>
              </ListItem.SupportingContent>
            </ListItem>
          </SwipeToDismissBox>
        ))}

        {/* Swipe left-to-right to archive */}
        {archiveItems.map((item) => (
          <SwipeToDismissBox
            key={item.id}
            enableDismissFromEndToStart={false}
            onStartToEnd={() => setArchiveItems((prev) => prev.filter((i) => i.id !== item.id))}>
            <SwipeToDismissBox.BackgroundContent>
              <Box
                contentAlignment="center"
                modifiers={[
                  fillMaxSize(),
                  clip(Shapes.RoundedCorner(24)),
                  background('#4CAF50'),
                  paddingAll(16),
                ]}>
                <Icon source={archiveIcon} size={24} tintColor="#FFFFFF" />
              </Box>
            </SwipeToDismissBox.BackgroundContent>
            <ListItem headline={item.title} modifiers={[fillMaxWidth()]}>
              <ListItem.SupportingContent>
                <ComposeText>{item.subtitle}</ComposeText>
              </ListItem.SupportingContent>
            </ListItem>
          </SwipeToDismissBox>
        ))}

        {/* Swipe both ways: right to archive, left to delete */}
        {biItems.map((item) => (
          <SwipeToDismissBox
            key={item.id}
            onStartToEnd={() => setBiItems((prev) => prev.filter((i) => i.id !== item.id))}
            onEndToStart={() => setBiItems((prev) => prev.filter((i) => i.id !== item.id))}>
            <SwipeToDismissBox.BackgroundStartToEnd>
              <Box
                contentAlignment="center"
                modifiers={[
                  fillMaxSize(),
                  clip(Shapes.RoundedCorner(24)),
                  background('#4CAF50'),
                  paddingAll(16),
                ]}>
                <Icon source={archiveIcon} size={24} tintColor="#FFFFFF" />
              </Box>
            </SwipeToDismissBox.BackgroundStartToEnd>
            <SwipeToDismissBox.BackgroundEndToStart>
              <Box
                contentAlignment="center"
                modifiers={[
                  fillMaxSize(),
                  clip(Shapes.RoundedCorner(24)),
                  background('#EF5350'),
                  paddingAll(16),
                ]}>
                <Icon source={deleteIcon} size={24} tintColor="#FFFFFF" />
              </Box>
            </SwipeToDismissBox.BackgroundEndToStart>
            <ListItem headline={item.title} modifiers={[fillMaxWidth()]}>
              <ListItem.SupportingContent>
                <ComposeText>{item.subtitle}</ComposeText>
              </ListItem.SupportingContent>
            </ListItem>
          </SwipeToDismissBox>
        ))}
      </LazyColumn>
    </Host>
  );
}

ListScreen.navigationOptions = {
  title: 'List',
};
