import {
  Host,
  ToggleButton,
  IconToggleButton,
  FilledIconToggleButton,
  OutlinedIconToggleButton,
  Text as ComposeText,
  Column,
  Row,
  Card,
  LazyColumn,
  Icon,
  Spacer,
} from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding, width } from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';

const starIcon = require('../../../assets/icons/api/Camera.png');

export default function ToggleButtonScreen() {
  const [checked1, setChecked1] = React.useState(false);
  const [checked2, setChecked2] = React.useState(false);
  const [checked3, setChecked3] = React.useState(true);
  const [checked4, setChecked4] = React.useState(false);
  const [checked5, setChecked5] = React.useState(true);

  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn verticalArrangement={{ spacedBy: 16 }} modifiers={[padding(16, 16, 16, 16)]}>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Toggle Button</ComposeText>
            <ComposeText>Default Material3 toggle button with text content.</ComposeText>
            <ToggleButton checked={checked1} onCheckedChange={setChecked1}>
              <Icon source={starIcon} size={ToggleButton.DefaultIconSize} />
              <Spacer modifiers={[width(ToggleButton.DefaultIconSpacing)]} />
              <ComposeText>Favorite</ComposeText>
            </ToggleButton>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Icon Toggle Button Variants</ComposeText>
            <ComposeText>Standard, filled, and outlined icon toggle buttons.</ComposeText>
            <Row horizontalArrangement={{ spacedBy: 8 }}>
              <IconToggleButton
                checked={checked2}
                onCheckedChange={setChecked2}
                colors={{
                  checkedContainerColor: '#6200EE',
                  checkedContentColor: '#FFFFFF',
                }}>
                <Icon source={starIcon} size={24} />
              </IconToggleButton>
              <FilledIconToggleButton checked={checked3} onCheckedChange={setChecked3}>
                <Icon source={starIcon} size={24} />
              </FilledIconToggleButton>
              <OutlinedIconToggleButton checked={checked4} onCheckedChange={setChecked4}>
                <Icon source={starIcon} size={24} />
              </OutlinedIconToggleButton>
            </Row>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Disabled</ComposeText>
            <ComposeText>Toggle buttons with enabled set to false.</ComposeText>
            <ToggleButton checked={false} enabled={false}>
              <ComposeText>Disabled</ComposeText>
            </ToggleButton>
            <Row horizontalArrangement={{ spacedBy: 8 }}>
              <IconToggleButton checked={false} enabled={false}>
                <Icon source={starIcon} size={24} />
              </IconToggleButton>
              <FilledIconToggleButton checked enabled={false}>
                <Icon source={starIcon} size={24} />
              </FilledIconToggleButton>
            </Row>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Custom Colors</ComposeText>
            <ComposeText>Override checked and unchecked colors.</ComposeText>
            <ToggleButton
              checked={checked5}
              onCheckedChange={setChecked5}
              colors={{
                checkedContainerColor: '#4CAF50',
                checkedContentColor: '#FFFFFF',
                containerColor: '#E0E0E0',
                contentColor: '#333333',
              }}>
              <ComposeText>{checked5 ? 'ON' : 'OFF'}</ComposeText>
            </ToggleButton>
          </Column>
        </Card>
      </LazyColumn>
    </Host>
  );
}

ToggleButtonScreen.navigationOptions = {
  title: 'ToggleButton',
};
