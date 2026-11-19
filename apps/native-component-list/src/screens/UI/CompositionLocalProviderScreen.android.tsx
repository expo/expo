import {
  Card,
  Checkbox,
  Column,
  CompositionLocalProvider,
  Host,
  IconButton,
  LazyColumn,
  Row,
  Text as ComposeText,
} from '@expo/ui/jetpack-compose';
import { background, fillMaxWidth, padding, size } from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';

function SmallControls() {
  const [checked, setChecked] = React.useState(false);
  return (
    <Row horizontalArrangement={{ spacedBy: 8 }} verticalAlignment="center">
      <IconButton modifiers={[size(24, 24)]} onClick={() => console.log('IconButton')}>
        <ComposeText>+</ComposeText>
      </IconButton>
      <Checkbox value={checked} onCheckedChange={setChecked} />
    </Row>
  );
}

export default function CompositionLocalProviderScreen() {
  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn verticalArrangement={{ spacedBy: 16 }} modifiers={[padding(16, 16, 16, 16)]}>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Default</ComposeText>
            <ComposeText>Material reserves a 48dp touch target around each control.</ComposeText>
            <Column modifiers={[background('#E3F2FD')]}>
              <SmallControls />
            </Column>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>minimumInteractiveComponentSize: 0</ComposeText>
            <ComposeText>Controls take only the size they need.</ComposeText>
            <Column modifiers={[background('#E3F2FD')]}>
              <CompositionLocalProvider values={{ minimumInteractiveComponentSize: 0 }}>
                <SmallControls />
              </CompositionLocalProvider>
            </Column>
          </Column>
        </Card>
      </LazyColumn>
    </Host>
  );
}
