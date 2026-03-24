import {
  DropdownMenuItem,
  ExposedDropdownMenuPicker,
  Host,
  Text as ComposeText,
} from '@expo/ui/jetpack-compose';
import * as React from 'react';
import { Text } from 'react-native';

import { Page, Section } from '../../components/Page';

const LANGUAGES = [
  { label: 'Java', value: 'java' },
  { label: 'JavaScript', value: 'js' },
  { label: 'TypeScript', value: 'ts' },
  { label: 'Python', value: 'python' },
  { label: 'Rust', value: 'rust' },
  { label: 'Go', value: 'go' },
  { label: 'C++', value: 'cpp' },
  { label: 'Kotlin', value: 'kotlin' },
  { label: 'Swift', value: 'swift' },
];

export default function ExposedDropdownMenuPickerScreen() {
  const [selected, setSelected] = React.useState('java');
  const [expanded, setExpanded] = React.useState(false);

  const [expanded2, setExpanded2] = React.useState(false);

  const [selected3, setSelected3] = React.useState('ts');
  const [expanded3, setExpanded3] = React.useState(false);

  const selectedLabel = LANGUAGES.find((l) => l.value === selected)?.label ?? '';
  const selectedLabel3 = LANGUAGES.find((l) => l.value === selected3)?.label ?? '';

  return (
    <Page>
      <Section title="Basic">
        <Host matchContents>
          <ExposedDropdownMenuPicker
            value={selectedLabel}
            expanded={expanded}
            onExpandedChange={setExpanded}>
            <ExposedDropdownMenuPicker.Items>
              {LANGUAGES.map((lang) => (
                <DropdownMenuItem
                  key={lang.value}
                  onClick={() => {
                    setSelected(lang.value);
                    setExpanded(false);
                  }}>
                  <DropdownMenuItem.Text>
                    <ComposeText>{lang.label}</ComposeText>
                  </DropdownMenuItem.Text>
                </DropdownMenuItem>
              ))}
            </ExposedDropdownMenuPicker.Items>
          </ExposedDropdownMenuPicker>
        </Host>
        <Text>Selected: {selected}</Text>
      </Section>

      <Section title="Disabled">
        <Host matchContents>
          <ExposedDropdownMenuPicker value="TypeScript" expanded={false} enabled={false}>
            <ExposedDropdownMenuPicker.Items>
              <DropdownMenuItem>
                <DropdownMenuItem.Text>
                  <ComposeText>TypeScript</ComposeText>
                </DropdownMenuItem.Text>
              </DropdownMenuItem>
            </ExposedDropdownMenuPicker.Items>
          </ExposedDropdownMenuPicker>
        </Host>
      </Section>

      <Section title="With disabled items">
        <Host matchContents>
          <ExposedDropdownMenuPicker
            value="Available"
            expanded={expanded2}
            onExpandedChange={setExpanded2}>
            <ExposedDropdownMenuPicker.Items>
              <DropdownMenuItem onClick={() => setExpanded2(false)}>
                <DropdownMenuItem.Text>
                  <ComposeText>Available</ComposeText>
                </DropdownMenuItem.Text>
              </DropdownMenuItem>
              <DropdownMenuItem enabled={false}>
                <DropdownMenuItem.Text>
                  <ComposeText>Disabled</ComposeText>
                </DropdownMenuItem.Text>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setExpanded2(false)}>
                <DropdownMenuItem.Text>
                  <ComposeText>Also available</ComposeText>
                </DropdownMenuItem.Text>
              </DropdownMenuItem>
              <DropdownMenuItem enabled={false}>
                <DropdownMenuItem.Text>
                  <ComposeText>Also disabled</ComposeText>
                </DropdownMenuItem.Text>
              </DropdownMenuItem>
            </ExposedDropdownMenuPicker.Items>
          </ExposedDropdownMenuPicker>
        </Host>
      </Section>
      <Section title="Custom colors">
        <Host matchContents>
          <ExposedDropdownMenuPicker
            value={selectedLabel3}
            expanded={expanded3}
            onExpandedChange={setExpanded3}
            colors={{
              unfocusedContainerColor: '#e0e7ff',
              focusedContainerColor: '#c7d2fe',
              unfocusedTextColor: '#3730a3',
              focusedTextColor: '#3730a3',
              unfocusedIndicatorColor: '#818cf8',
              focusedIndicatorColor: '#4f46e5',
              unfocusedTrailingIconColor: '#6366f1',
              focusedTrailingIconColor: '#4338ca',
              menuContainerColor: '#eef2ff',
            }}>
            <ExposedDropdownMenuPicker.Items>
              {LANGUAGES.map((lang) => (
                <DropdownMenuItem
                  key={lang.value}
                  onClick={() => {
                    setSelected3(lang.value);
                    setExpanded3(false);
                  }}>
                  <DropdownMenuItem.Text>
                    <ComposeText>{lang.label}</ComposeText>
                  </DropdownMenuItem.Text>
                </DropdownMenuItem>
              ))}
            </ExposedDropdownMenuPicker.Items>
          </ExposedDropdownMenuPicker>
        </Host>
        <Text>Selected: {selected3}</Text>
      </Section>
    </Page>
  );
}

ExposedDropdownMenuPickerScreen.navigationOptions = {
  title: 'ExposedDropdownMenuPicker',
};
