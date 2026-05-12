import {
  Host,
  IconButton,
  FilledIconButton,
  FilledTonalIconButton,
  OutlinedIconButton,
  Text as ComposeText,
  Column,
  Row,
  Card,
  LazyColumn,
} from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';

export default function IconButtonScreen() {
  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn verticalArrangement={{ spacedBy: 16 }} modifiers={[padding(16, 16, 16, 16)]}>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Icon Button Variants</ComposeText>
            <ComposeText>Standard, filled, filled tonal, and outlined icon buttons.</ComposeText>
            <Row horizontalArrangement={{ spacedBy: 8 }}>
              <IconButton onClick={() => console.log('Standard')}>
                <ComposeText>S</ComposeText>
              </IconButton>
              <FilledIconButton onClick={() => console.log('Filled')}>
                <ComposeText>F</ComposeText>
              </FilledIconButton>
              <FilledTonalIconButton onClick={() => console.log('Tonal')}>
                <ComposeText>T</ComposeText>
              </FilledTonalIconButton>
              <OutlinedIconButton onClick={() => console.log('Outlined')}>
                <ComposeText>O</ComposeText>
              </OutlinedIconButton>
            </Row>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Disabled</ComposeText>
            <ComposeText>Icon buttons with enabled set to false.</ComposeText>
            <Row horizontalArrangement={{ spacedBy: 8 }}>
              <IconButton enabled={false}>
                <ComposeText>S</ComposeText>
              </IconButton>
              <FilledIconButton enabled={false}>
                <ComposeText>F</ComposeText>
              </FilledIconButton>
              <FilledTonalIconButton enabled={false}>
                <ComposeText>T</ComposeText>
              </FilledTonalIconButton>
              <OutlinedIconButton enabled={false}>
                <ComposeText>O</ComposeText>
              </OutlinedIconButton>
            </Row>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Custom Colors</ComposeText>
            <ComposeText>Override container and content colors.</ComposeText>
            <Row horizontalArrangement={{ spacedBy: 8 }}>
              <FilledIconButton
                onClick={() => {}}
                colors={{ containerColor: '#6200EE', contentColor: '#FFFFFF' }}>
                <ComposeText>P</ComposeText>
              </FilledIconButton>
              <FilledIconButton
                onClick={() => {}}
                colors={{ containerColor: '#FF6347', contentColor: '#FFFFFF' }}>
                <ComposeText>R</ComposeText>
              </FilledIconButton>
            </Row>
          </Column>
        </Card>
      </LazyColumn>
    </Host>
  );
}

IconButtonScreen.navigationOptions = {
  title: 'IconButton',
};
