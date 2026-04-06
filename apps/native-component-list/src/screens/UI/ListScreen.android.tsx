import {
  Box,
  Host,
  Icon,
  LazyColumn,
  ListItem,
  SwipeToDismissBox,
  Switch,
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
const bluetoothIcon = require('../../../assets/icons/ui/bluetooth.xml');
const wifiIcon = require('../../../assets/icons/ui/wifi.xml');

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
  const [wifiEnabled, setWifiEnabled] = React.useState(true);
  const [bluetoothEnabled, setBluetoothEnabled] = React.useState(false);

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

        <ListItem modifiers={[fillMaxWidth()]}>
          <ListItem.HeadlineContent>
            <ComposeText>Basic List Item</ComposeText>
          </ListItem.HeadlineContent>
        </ListItem>

        <ListItem modifiers={[fillMaxWidth()]}>
          <ListItem.HeadlineContent>
            <ComposeText>With Leading Icon</ComposeText>
          </ListItem.HeadlineContent>
          <ListItem.LeadingContent>
            <Icon source={wifiIcon} size={24} />
          </ListItem.LeadingContent>
        </ListItem>

        <ListItem modifiers={[fillMaxWidth()]}>
          <ListItem.HeadlineContent>
            <ComposeText>With Supporting Text</ComposeText>
          </ListItem.HeadlineContent>
          <ListItem.SupportingContent>
            <ComposeText>Secondary line of text</ComposeText>
          </ListItem.SupportingContent>
        </ListItem>

        <ListItem modifiers={[fillMaxWidth()]}>
          <ListItem.OverlineContent>
            <ComposeText>CATEGORY</ComposeText>
          </ListItem.OverlineContent>
          <ListItem.HeadlineContent>
            <ComposeText>With Overline</ComposeText>
          </ListItem.HeadlineContent>
          <ListItem.SupportingContent>
            <ComposeText>Supporting text below</ComposeText>
          </ListItem.SupportingContent>
        </ListItem>

        <ListItem modifiers={[fillMaxWidth()]}>
          <ListItem.HeadlineContent>
            <ComposeText>Wi-Fi</ComposeText>
          </ListItem.HeadlineContent>
          <ListItem.LeadingContent>
            <Icon source={wifiIcon} size={24} />
          </ListItem.LeadingContent>
          <ListItem.SupportingContent>
            <ComposeText>{wifiEnabled ? 'Connected' : 'Disabled'}</ComposeText>
          </ListItem.SupportingContent>
          <ListItem.TrailingContent>
            <Switch value={wifiEnabled} onCheckedChange={setWifiEnabled} />
          </ListItem.TrailingContent>
        </ListItem>

        <ListItem modifiers={[fillMaxWidth()]}>
          <ListItem.HeadlineContent>
            <ComposeText>Bluetooth</ComposeText>
          </ListItem.HeadlineContent>
          <ListItem.LeadingContent>
            <Icon source={bluetoothIcon} size={24} />
          </ListItem.LeadingContent>
          <ListItem.SupportingContent>
            <ComposeText>{bluetoothEnabled ? 'On' : 'Off'}</ComposeText>
          </ListItem.SupportingContent>
          <ListItem.TrailingContent>
            <Switch value={bluetoothEnabled} onCheckedChange={setBluetoothEnabled} />
          </ListItem.TrailingContent>
        </ListItem>

        <ListItem modifiers={[fillMaxWidth()]}>
          <ListItem.HeadlineContent>
            <ComposeText style={{ typography: 'titleMedium' }}>Custom Headline</ComposeText>
          </ListItem.HeadlineContent>
          <ListItem.SupportingContent>
            <ComposeText>Using HeadlineContent slot for rich text</ComposeText>
          </ListItem.SupportingContent>
        </ListItem>

        <ListItem
          modifiers={[fillMaxWidth()]}
          colors={{
            containerColor: '#1E1E2E',
            contentColor: '#CDD6F4',
            supportingContentColor: '#BAC2DE',
          }}>
          <ListItem.HeadlineContent>
            <ComposeText>Custom Colors</ComposeText>
          </ListItem.HeadlineContent>
          <ListItem.SupportingContent>
            <ComposeText>Dark themed list item</ComposeText>
          </ListItem.SupportingContent>
        </ListItem>
      </LazyColumn>
    </Host>
  );
}

ListScreen.navigationOptions = {
  title: 'List',
};
