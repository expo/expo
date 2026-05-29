import {
  BasicTextField,
  BasicTextFieldRef,
  Button,
  Card,
  Column,
  Host,
  LazyColumn,
  Row,
  Switch,
  Text as ComposeText,
  useNativeState,
} from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding, weight } from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';

export default function BasicTextFieldScreen() {
  const value = useNativeState('');
  const [text, setText] = React.useState('');
  const [focused, setFocused] = React.useState(false);
  const [lastAction, setLastAction] = React.useState('none');
  const ref = React.useRef<BasicTextFieldRef>(null);

  const [enabled, setEnabled] = React.useState(true);
  const [readOnly, setReadOnly] = React.useState(false);
  const [singleLine, setSingleLine] = React.useState(true);
  const [secure, setSecure] = React.useState(false);

  const p = padding(16, 12, 16, 12);
  const cardModifiers = [fillMaxWidth()];

  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn
        verticalArrangement={{ spacedBy: 8 }}
        modifiers={[padding(12, 8, 12, 8), fillMaxWidth()]}>
        <Card modifiers={cardModifiers}>
          <Column modifiers={[p]} verticalArrangement={{ spacedBy: 8 }}>
            <ComposeText style={{ typography: 'labelLarge' }}>Undecorated</ComposeText>
            <BasicTextField
              ref={ref}
              value={value}
              enabled={enabled}
              readOnly={readOnly}
              singleLine={singleLine}
              maxLines={singleLine ? undefined : 5}
              cursorColor="#7c3aed"
              visualTransformation={secure ? 'password' : 'none'}
              textStyle={{ fontSize: 18, color: '#111827' }}
              keyboardOptions={{ keyboardType: 'text', imeAction: 'done' }}
              keyboardActions={{ onDone: (v) => setLastAction(`done: ${v}`) }}
              onValueChange={setText}
              onFocusChanged={setFocused}
              modifiers={[fillMaxWidth()]}
            />
            <ComposeText style={{ typography: 'bodySmall' }}>
              Value: {JSON.stringify(text)} | Focused: {String(focused)} | Action: {lastAction}
            </ComposeText>
            <Row horizontalArrangement={{ spacedBy: 8 }}>
              <Button onClick={() => ref.current?.setText('Reset!')}>
                <ComposeText>setText</ComposeText>
              </Button>
              <Button onClick={() => ref.current?.clear()}>
                <ComposeText>clear</ComposeText>
              </Button>
              <Button onClick={() => ref.current?.focus()}>
                <ComposeText>focus</ComposeText>
              </Button>
              <Button onClick={() => ref.current?.blur()}>
                <ComposeText>blur</ComposeText>
              </Button>
            </Row>
          </Column>
        </Card>

        <Card modifiers={cardModifiers}>
          <Column modifiers={[p]} verticalArrangement={{ spacedBy: 8 }}>
            <ComposeText style={{ typography: 'labelLarge' }}>decorationBox</ComposeText>
            <BasicTextField
              value={value}
              cursorColor="#7c3aed"
              onValueChange={setText}
              modifiers={[fillMaxWidth()]}>
              <BasicTextField.DecorationBox>
                {text.length === 0 ? <ComposeText color="#9ca3af">Type here…</ComposeText> : null}
                <BasicTextField.InnerTextField />
              </BasicTextField.DecorationBox>
            </BasicTextField>
            <ComposeText style={{ typography: 'bodySmall' }}>
              `decorationBox` wraps `InnerTextField`. Here the placeholder sits behind it and hides
              once there's text.
            </ComposeText>
          </Column>
        </Card>

        {/* Props */}
        <Card modifiers={cardModifiers}>
          <Column modifiers={[p]} verticalArrangement={{ spacedBy: 2 }}>
            <ComposeText style={{ typography: 'labelLarge' }}>Props</ComposeText>
            <SwitchRow label="Enabled" value={enabled} onCheckedChange={setEnabled} />
            <SwitchRow label="Read Only" value={readOnly} onCheckedChange={setReadOnly} />
            <SwitchRow label="Single Line" value={singleLine} onCheckedChange={setSingleLine} />
            <SwitchRow label="Secure (password)" value={secure} onCheckedChange={setSecure} />
          </Column>
        </Card>
      </LazyColumn>
    </Host>
  );
}

function SwitchRow({
  label,
  value,
  onCheckedChange,
}: {
  label: string;
  value: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <Row verticalAlignment="center" modifiers={[fillMaxWidth()]}>
      <ComposeText modifiers={[weight(1)]}>{label}</ComposeText>
      <Switch value={value} onCheckedChange={onCheckedChange} />
    </Row>
  );
}

BasicTextFieldScreen.navigationOptions = {
  title: 'BasicTextField',
};
