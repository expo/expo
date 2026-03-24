import {
  HorizontalDivider,
  VerticalDivider,
  Host,
  Card,
  Column,
  Row,
  LazyColumn,
  Text as ComposeText,
} from '@expo/ui/jetpack-compose';
import { fillMaxWidth, height, padding } from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';
import { StyleSheet } from 'react-native';

export default function DividerScreen() {
  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn verticalArrangement={{ spacedBy: 16 }} modifiers={[padding(16, 16, 16, 16)]}>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText style={{ typography: 'titleMedium' }}>HorizontalDivider</ComposeText>
            <ComposeText style={{ typography: 'bodySmall' }} color="#666666">
              Default thickness and color.
            </ComposeText>
            <ComposeText>Above divider</ComposeText>
            <HorizontalDivider />
            <ComposeText>Below divider</ComposeText>
          </Column>
        </Card>

        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText style={{ typography: 'titleMedium' }}>Hairline Divider</ComposeText>
            <ComposeText style={{ typography: 'bodySmall' }} color="#666666">
              Single pixel line using StyleSheet.hairlineWidth.
            </ComposeText>
            <ComposeText>Above divider</ComposeText>
            <HorizontalDivider thickness={StyleSheet.hairlineWidth} />
            <ComposeText>Below divider</ComposeText>
          </Column>
        </Card>

        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText style={{ typography: 'titleMedium' }}>Custom Divider</ComposeText>
            <ComposeText style={{ typography: 'bodySmall' }} color="#666666">
              Thick red divider.
            </ComposeText>
            <ComposeText>Above divider</ComposeText>
            <HorizontalDivider thickness={4} color="#E91E63" />
            <ComposeText>Below divider</ComposeText>
          </Column>
        </Card>

        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText style={{ typography: 'titleMedium' }}>VerticalDivider</ComposeText>
            <ComposeText style={{ typography: 'bodySmall' }} color="#666666">
              Vertical divider between items.
            </ComposeText>
            <Row
              horizontalArrangement={{ spacedBy: 16 }}
              verticalAlignment="center"
              modifiers={[height(48)]}>
              <ComposeText>Left</ComposeText>
              <VerticalDivider />
              <ComposeText>Center</ComposeText>
              <VerticalDivider thickness={2} color="#6200EE" />
              <ComposeText>Right</ComposeText>
            </Row>
          </Column>
        </Card>
      </LazyColumn>
    </Host>
  );
}

DividerScreen.navigationOptions = {
  title: 'Divider',
};
