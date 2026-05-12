import {
  Host,
  Button,
  FilledTonalButton,
  OutlinedButton,
  ElevatedButton,
  TextButton,
  Text as ComposeText,
  Column,
  Card,
  LazyColumn,
  Shape,
  Icon,
  Spacer,
} from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding, width } from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';

const addIcon = require('../../../assets/icons/api/Camera.png');
const sendIcon = require('../../../assets/icons/api/Notification.png');

export default function ButtonScreen() {
  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn verticalArrangement={{ spacedBy: 16 }} modifiers={[padding(16, 16, 16, 16)]}>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Filled Button</ComposeText>
            <ComposeText>Default Material3 filled button.</ComposeText>
            <Button onClick={() => console.log('Filled clicked')}>
              <ComposeText>Filled</ComposeText>
            </Button>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Filled Tonal Button</ComposeText>
            <ComposeText>A softer alternative to a filled button.</ComposeText>
            <FilledTonalButton onClick={() => console.log('Tonal clicked')}>
              <ComposeText>Filled Tonal</ComposeText>
            </FilledTonalButton>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Outlined Button</ComposeText>
            <ComposeText>A medium-emphasis button with a border.</ComposeText>
            <OutlinedButton onClick={() => console.log('Outlined clicked')}>
              <ComposeText>Outlined</ComposeText>
            </OutlinedButton>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Elevated Button</ComposeText>
            <ComposeText>A tonal button with a shadow for more emphasis.</ComposeText>
            <ElevatedButton onClick={() => console.log('Elevated clicked')}>
              <ComposeText>Elevated</ComposeText>
            </ElevatedButton>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Text Button</ComposeText>
            <ComposeText>A low-emphasis button without a container.</ComposeText>
            <TextButton onClick={() => console.log('Text clicked')}>
              <ComposeText>Text</ComposeText>
            </TextButton>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Disabled</ComposeText>
            <ComposeText>Buttons with enabled set to false.</ComposeText>
            <Button enabled={false}>
              <ComposeText>Disabled Filled</ComposeText>
            </Button>
            <OutlinedButton enabled={false}>
              <ComposeText>Disabled Outlined</ComposeText>
            </OutlinedButton>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Custom Colors</ComposeText>
            <ComposeText>Override container and content colors.</ComposeText>
            <Button colors={{ containerColor: '#6200EE', contentColor: '#FFFFFF' }}>
              <ComposeText>Purple</ComposeText>
            </Button>
            <FilledTonalButton colors={{ containerColor: '#FF6347', contentColor: '#FFFFFF' }}>
              <ComposeText>Tomato</ComposeText>
            </FilledTonalButton>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Leading & Trailing Icons</ComposeText>
            <ComposeText>Use Icon as a child to add leading or trailing icons.</ComposeText>
            <Button onClick={() => console.log('Add clicked')}>
              <Icon source={addIcon} size={18} tint="#FFFFFF" />
              <Spacer modifiers={[width(8)]} />
              <ComposeText>Add Item</ComposeText>
            </Button>
            <OutlinedButton onClick={() => console.log('Send clicked')}>
              <ComposeText>Send</ComposeText>
              <Spacer modifiers={[width(8)]} />
              <Icon source={sendIcon} size={18} />
            </OutlinedButton>
            <FilledTonalButton onClick={() => console.log('Both icons clicked')}>
              <Icon source={addIcon} size={18} />
              <Spacer modifiers={[width(8)]} />
              <ComposeText>Create & Send</ComposeText>
              <Spacer modifiers={[width(8)]} />
              <Icon source={sendIcon} size={18} />
            </FilledTonalButton>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Custom Shapes</ComposeText>
            <ComposeText>Buttons with custom shapes.</ComposeText>
            <Button shape={Shape.RoundedCorner({ cornerRadii: { topStart: 16, bottomEnd: 16 } })}>
              <ComposeText>Rounded Corner</ComposeText>
            </Button>
            <ElevatedButton
              shape={Shape.PillStar({
                innerRadius: 0.5,
                radius: 1,
                verticesCount: 20,
                smoothing: 1,
              })}>
              <ComposeText>Star</ComposeText>
            </ElevatedButton>
          </Column>
        </Card>
      </LazyColumn>
    </Host>
  );
}

ButtonScreen.navigationOptions = {
  title: 'Button',
};
