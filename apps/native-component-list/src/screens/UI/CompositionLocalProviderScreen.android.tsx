import {
  BasicTextField,
  Card,
  Checkbox,
  Column,
  CompositionLocalProvider,
  Host,
  IconButton,
  LazyColumn,
  Row,
  Text as ComposeText,
  useNativeState,
} from '@expo/ui/jetpack-compose';
import {
  background,
  border,
  fillMaxWidth,
  padding,
  semantics,
  size,
} from '@expo/ui/jetpack-compose/modifiers';
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

function SignInFields() {
  const username = useNativeState('');
  const password = useNativeState('');
  const fieldModifiers = [fillMaxWidth(), border(1, '#9CA3AF'), padding(12, 12, 12, 12)];
  return (
    <Column verticalArrangement={{ spacedBy: 8 }}>
      <BasicTextField
        value={username}
        singleLine
        modifiers={[...fieldModifiers, semantics({ contentType: 'username' })]}
      />
      <BasicTextField
        value={password}
        singleLine
        visualTransformation="password"
        modifiers={[...fieldModifiers, semantics({ contentType: 'password' })]}
      />
    </Column>
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
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Default autofill highlight</ComposeText>
            <ComposeText>Fill these from a saved login to see the yellow highlight.</ComposeText>
            <SignInFields />
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>autofillHighlightColor: transparent</ComposeText>
            <ComposeText>The filled fields keep their own background.</ComposeText>
            <CompositionLocalProvider values={{ autofillHighlightColor: 'transparent' }}>
              <SignInFields />
            </CompositionLocalProvider>
          </Column>
        </Card>
      </LazyColumn>
    </Host>
  );
}
