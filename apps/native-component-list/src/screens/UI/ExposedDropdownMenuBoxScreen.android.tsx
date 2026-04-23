import {
  DropdownMenuItem,
  ExposedDropdownMenuBox,
  ExposedDropdownMenu,
  Host,
  Icon,
  Text as ComposeText,
  TextField,
  useNativeState,
} from '@expo/ui/jetpack-compose';
import {
  animated,
  background,
  fillMaxWidth,
  graphicsLayer,
  menuAnchor,
} from '@expo/ui/jetpack-compose/modifiers';
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

function DropdownArrow({ expanded }: { expanded: boolean }) {
  return (
    <TextField.TrailingIcon>
      <Icon
        source={require('../../../assets/icons/ui/arrow_drop_down.xml')}
        modifiers={[graphicsLayer({ rotationZ: animated(expanded ? 180 : 0) })]}
      />
    </TextField.TrailingIcon>
  );
}

function TextInputAnchor({
  value,
  expanded,
  enabled = true,
}: {
  value: string;
  expanded: boolean;
  enabled?: boolean;
}) {
  const labelState = useNativeState(value);
  return (
    <TextField value={labelState} readOnly enabled={enabled} modifiers={[menuAnchor()]}>
      <DropdownArrow expanded={expanded} />
    </TextField>
  );
}

export default function ExposedDropdownMenuBoxScreen() {
  const [selected, setSelected] = React.useState('java');
  const [expanded, setExpanded] = React.useState(false);

  const [selected2, setSelected2] = React.useState('Available');
  const [expanded2, setExpanded2] = React.useState(false);

  const [selected3, setSelected3] = React.useState('ts');
  const [expanded3, setExpanded3] = React.useState(false);

  const [selected4, setSelected4] = React.useState('ts');
  const [expanded4, setExpanded4] = React.useState(false);

  const selectedLabel = LANGUAGES.find((l) => l.value === selected)?.label ?? '';
  const selectedLabel3 = LANGUAGES.find((l) => l.value === selected3)?.label ?? '';
  const selectedLabel4 = LANGUAGES.find((l) => l.value === selected4)?.label ?? '';

  return (
    <Page>
      <Section title="Basic">
        <Host matchContents>
          <ExposedDropdownMenuBox expanded={expanded} onExpandedChange={setExpanded}>
            <TextInputAnchor value={selectedLabel} expanded={expanded} />
            <ExposedDropdownMenu expanded={expanded} onDismissRequest={() => setExpanded(false)}>
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
            </ExposedDropdownMenu>
          </ExposedDropdownMenuBox>
        </Host>
        <Text>Selected: {selected}</Text>
      </Section>

      <Section title="Disabled">
        <Host matchContents>
          <ExposedDropdownMenuBox expanded={false}>
            <TextInputAnchor value="TypeScript" expanded={false} enabled={false} />
            <ExposedDropdownMenu expanded={false}>
              <DropdownMenuItem>
                <DropdownMenuItem.Text>
                  <ComposeText>TypeScript</ComposeText>
                </DropdownMenuItem.Text>
              </DropdownMenuItem>
            </ExposedDropdownMenu>
          </ExposedDropdownMenuBox>
        </Host>
      </Section>

      <Section title="With disabled items">
        <Host matchContents>
          <ExposedDropdownMenuBox expanded={expanded2} onExpandedChange={setExpanded2}>
            <TextInputAnchor value={selected2} expanded={expanded2} />
            <ExposedDropdownMenu expanded={expanded2} onDismissRequest={() => setExpanded2(false)}>
              <DropdownMenuItem
                onClick={() => {
                  setSelected2('Available');
                  setExpanded2(false);
                }}>
                <DropdownMenuItem.Text>
                  <ComposeText>Available</ComposeText>
                </DropdownMenuItem.Text>
              </DropdownMenuItem>
              <DropdownMenuItem enabled={false}>
                <DropdownMenuItem.Text>
                  <ComposeText>Disabled</ComposeText>
                </DropdownMenuItem.Text>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelected2('Also available');
                  setExpanded2(false);
                }}>
                <DropdownMenuItem.Text>
                  <ComposeText>Also available</ComposeText>
                </DropdownMenuItem.Text>
              </DropdownMenuItem>
              <DropdownMenuItem enabled={false}>
                <DropdownMenuItem.Text>
                  <ComposeText>Also disabled</ComposeText>
                </DropdownMenuItem.Text>
              </DropdownMenuItem>
            </ExposedDropdownMenu>
          </ExposedDropdownMenuBox>
        </Host>
      </Section>

      <Section title="Custom anchor">
        <Host matchContents>
          <ExposedDropdownMenuBox expanded={expanded3} onExpandedChange={setExpanded3}>
            <ComposeText modifiers={[menuAnchor(), fillMaxWidth(0.5), background('#e0e7ff')]}>
              {selectedLabel3 || 'Select a language'}
            </ComposeText>
            <ExposedDropdownMenu expanded={expanded3} onDismissRequest={() => setExpanded3(false)}>
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
            </ExposedDropdownMenu>
          </ExposedDropdownMenuBox>
        </Host>
        <Text>Selected: {selected3}</Text>
      </Section>

      <Section title="Custom menu color">
        <Host matchContents>
          <ExposedDropdownMenuBox expanded={expanded4} onExpandedChange={setExpanded4}>
            <TextInputAnchor value={selectedLabel4} expanded={expanded4} />
            <ExposedDropdownMenu
              expanded={expanded4}
              onDismissRequest={() => setExpanded4(false)}
              containerColor="lightblue">
              {LANGUAGES.map((lang) => (
                <DropdownMenuItem
                  key={lang.value}
                  onClick={() => {
                    setSelected4(lang.value);
                    setExpanded4(false);
                  }}>
                  <DropdownMenuItem.Text>
                    <ComposeText>{lang.label}</ComposeText>
                  </DropdownMenuItem.Text>
                </DropdownMenuItem>
              ))}
            </ExposedDropdownMenu>
          </ExposedDropdownMenuBox>
        </Host>
        <Text>Selected: {selected4}</Text>
      </Section>
    </Page>
  );
}

ExposedDropdownMenuBoxScreen.navigationOptions = {
  title: 'ExposedDropdownMenuBox',
};
