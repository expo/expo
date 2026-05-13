import {
  Host,
  Switch,
  Box,
  Text as ComposeText,
  Column,
  Card,
  LazyColumn,
} from '@expo/ui/jetpack-compose';
import {
  fillMaxWidth,
  padding,
  size,
  clip,
  background,
  Shapes,
} from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';

export default function SwitchScreen() {
  const [checked, setChecked] = React.useState<boolean>(true);
  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn verticalArrangement={{ spacedBy: 16 }} modifiers={[padding(16, 16, 16, 16)]}>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Default</ComposeText>
            <ComposeText>Default Material3 switch with no customization.</ComposeText>
            <Switch value={checked} onCheckedChange={setChecked} />
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Custom Colors</ComposeText>
            <ComposeText>Override thumb, track, border and icon colors.</ComposeText>
            <Switch
              value={checked}
              onCheckedChange={setChecked}
              colors={{
                checkedBorderColor: '#7C3AED',
                uncheckedBorderColor: '#D1D5DB',
                checkedTrackColor: '#EDE9FE',
                uncheckedTrackColor: '#F3F4F6',
                checkedIconColor: '#7C3AED',
                uncheckedIconColor: '#9CA3AF',
                checkedThumbColor: '#7C3AED',
                uncheckedThumbColor: '#9CA3AF',
              }}>
              <Switch.ThumbContent>
                <Box
                  modifiers={[
                    size(Switch.DefaultIconSize, Switch.DefaultIconSize),
                    clip(Shapes.Circle),
                    background(checked ? '#FFFFFF' : '#E5E7EB'),
                  ]}
                />
              </Switch.ThumbContent>
            </Switch>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Disabled</ComposeText>
            <ComposeText>Non-interactive switch using the enabled prop.</ComposeText>
            <Switch value={checked} enabled={false} />
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Disabled with Custom Colors</ComposeText>
            <ComposeText>Custom colors for disabled checked and unchecked states.</ComposeText>
            <Switch
              value={checked}
              enabled={false}
              colors={{
                disabledUncheckedThumbColor: '#F87171',
                disabledUncheckedTrackColor: '#FEE2E2',
                disabledUncheckedBorderColor: '#FCA5A5',
                disabledCheckedThumbColor: '#34D399',
                disabledCheckedTrackColor: '#D1FAE5',
                disabledCheckedBorderColor: '#6EE7B7',
              }}
            />
          </Column>
        </Card>
      </LazyColumn>
    </Host>
  );
}

SwitchScreen.navigationOptions = {
  title: 'Switch',
};
