import {
  Host,
  LazyColumn,
  ListItem,
  Icon,
  Switch,
  Text as ComposeText,
} from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';

const settingsIcon = require('../../../assets/icons/api/Camera.png');

export default function ListScreen() {
  const [wifiEnabled, setWifiEnabled] = React.useState(true);
  const [bluetoothEnabled, setBluetoothEnabled] = React.useState(false);

  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn modifiers={[fillMaxWidth()]}>
        <ListItem headline="Basic List Item" modifiers={[fillMaxWidth()]} />

        <ListItem headline="With Leading Icon" modifiers={[fillMaxWidth()]}>
          <ListItem.LeadingContent>
            <Icon source={settingsIcon} size={24} />
          </ListItem.LeadingContent>
        </ListItem>

        <ListItem headline="With Supporting Text" modifiers={[fillMaxWidth()]}>
          <ListItem.SupportingContent>
            <ComposeText>Secondary line of text</ComposeText>
          </ListItem.SupportingContent>
        </ListItem>

        <ListItem headline="With Overline" modifiers={[fillMaxWidth()]}>
          <ListItem.OverlineContent>
            <ComposeText>CATEGORY</ComposeText>
          </ListItem.OverlineContent>
          <ListItem.SupportingContent>
            <ComposeText>Supporting text below</ComposeText>
          </ListItem.SupportingContent>
        </ListItem>

        <ListItem headline="Wi-Fi" modifiers={[fillMaxWidth()]}>
          <ListItem.LeadingContent>
            <Icon source={settingsIcon} size={24} />
          </ListItem.LeadingContent>
          <ListItem.SupportingContent>
            <ComposeText>{wifiEnabled ? 'Connected' : 'Disabled'}</ComposeText>
          </ListItem.SupportingContent>
          <ListItem.TrailingContent>
            <Switch value={wifiEnabled} onCheckedChange={setWifiEnabled} />
          </ListItem.TrailingContent>
        </ListItem>

        <ListItem headline="Bluetooth" modifiers={[fillMaxWidth()]}>
          <ListItem.LeadingContent>
            <Icon source={settingsIcon} size={24} />
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
          headline="Custom Colors"
          modifiers={[fillMaxWidth()]}
          colors={{
            containerColor: '#1E1E2E',
            contentColor: '#CDD6F4',
            supportingContentColor: '#BAC2DE',
          }}>
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
