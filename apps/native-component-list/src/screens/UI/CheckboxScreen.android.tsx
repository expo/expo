import {
  Host,
  Checkbox,
  TriStateCheckbox,
  Text as ComposeText,
  Column,
  Row,
  Card,
  LazyColumn,
} from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding, toggleable } from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';

export default function CheckboxScreen() {
  const [checked, setChecked] = React.useState<boolean>(true);

  const [child1, setChild1] = React.useState(false);
  const [child2, setChild2] = React.useState(false);
  const [child3, setChild3] = React.useState(false);

  const parentState =
    child1 && child2 && child3 ? 'on' : !child1 && !child2 && !child3 ? 'off' : 'indeterminate';

  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn verticalArrangement={{ spacedBy: 16 }} modifiers={[padding(16, 16, 16, 16)]}>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Default</ComposeText>
            <ComposeText>Default Material3 checkbox with no customization.</ComposeText>
            <Checkbox value={checked} onCheckedChange={setChecked} />
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Custom Colors</ComposeText>
            <ComposeText>Override checked, unchecked, and checkmark colors.</ComposeText>
            <Checkbox
              value={checked}
              onCheckedChange={setChecked}
              colors={{
                checkedColor: '#6200EE',
                checkmarkColor: '#FFFFFF',
                uncheckedColor: '#9CA3AF',
              }}
            />
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Disabled</ComposeText>
            <ComposeText>Non-interactive checkbox using the enabled prop.</ComposeText>
            <Row horizontalArrangement={{ spacedBy: 16 }}>
              <Checkbox value enabled={false} />
              <Checkbox value={false} enabled={false} />
            </Row>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Select All (TriStateCheckbox)</ComposeText>
            <ComposeText>Parent checkbox reflects child states. Tap the row to toggle.</ComposeText>
            <Row
              verticalAlignment="center"
              horizontalArrangement={{ spacedBy: 8 }}
              modifiers={[
                toggleable(
                  parentState === 'on',
                  () => {
                    const newState = parentState !== 'on';
                    setChild1(newState);
                    setChild2(newState);
                    setChild3(newState);
                  },
                  { role: 'checkbox' }
                ),
              ]}>
              <TriStateCheckbox state={parentState} />
              <ComposeText>Select all</ComposeText>
            </Row>
            <Row
              verticalAlignment="center"
              horizontalArrangement={{ spacedBy: 8 }}
              modifiers={[toggleable(child1, () => setChild1(!child1), { role: 'checkbox' })]}>
              <Checkbox value={child1} />
              <ComposeText>Option 1</ComposeText>
            </Row>
            <Row
              verticalAlignment="center"
              horizontalArrangement={{ spacedBy: 8 }}
              modifiers={[toggleable(child2, () => setChild2(!child2), { role: 'checkbox' })]}>
              <Checkbox value={child2} />
              <ComposeText>Option 2</ComposeText>
            </Row>
            <Row
              verticalAlignment="center"
              horizontalArrangement={{ spacedBy: 8 }}
              modifiers={[toggleable(child3, () => setChild3(!child3), { role: 'checkbox' })]}>
              <Checkbox value={child3} />
              <ComposeText>Option 3</ComposeText>
            </Row>
          </Column>
        </Card>
      </LazyColumn>
    </Host>
  );
}

CheckboxScreen.navigationOptions = {
  title: 'Checkbox',
};
