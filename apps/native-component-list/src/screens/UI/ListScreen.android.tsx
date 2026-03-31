import {
  Host,
  LazyColumn,
  ListItem,
  Icon,
  Switch,
  Text as ComposeText,
} from '@expo/ui/jetpack-compose';
import { fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';

const bluetoothIcon = require('../../../assets/icons/ui/bluetooth.xml');
const wifiIcon = require('../../../assets/icons/ui/wifi.xml');

export default function ListScreen() {
  const [wifiEnabled, setWifiEnabled] = React.useState(true);
  const [bluetoothEnabled, setBluetoothEnabled] = React.useState(false);

  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn modifiers={[fillMaxWidth()]}>
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
