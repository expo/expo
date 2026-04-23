import {
  Box,
  Button,
  Column,
  FilledTonalButton,
  FlowRow,
  Host,
  LazyColumn,
  OutlinedButton,
  Row,
  SegmentedButton,
  SingleChoiceSegmentedButtonRow,
  Text,
  isDynamicColorAvailable,
  type MaterialColors,
  useMaterialColors,
} from '@expo/ui/jetpack-compose';
import {
  background,
  border,
  clickable,
  fillMaxWidth,
  padding,
  size,
} from '@expo/ui/jetpack-compose/modifiers';
import { useMemo, useState } from 'react';

type ColorSchemeOption = 'auto' | 'light' | 'dark';

type SeedPreset = {
  name: string;
  value: string | undefined;
};

const SEED_PRESETS: SeedPreset[] = [
  { name: 'Wallpaper', value: undefined },
  { name: 'Red', value: '#E53935' },
  { name: 'Orange', value: '#FB8C00' },
  { name: 'Yellow', value: '#FDD835' },
  { name: 'Green', value: '#43A047' },
  { name: 'Teal', value: '#00897B' },
  { name: 'Blue', value: '#1E88E5' },
  { name: 'Indigo', value: '#3949AB' },
  { name: 'Purple', value: '#8E24AA' },
  { name: 'Pink', value: '#D81B60' },
];

const COLOR_SCHEMES: ColorSchemeOption[] = ['auto', 'light', 'dark'];

export default function MaterialColorsScreen() {
  const [colorScheme, setColorScheme] = useState<ColorSchemeOption>('auto');
  const [seedColor, setSeedColor] = useState<string | undefined>(undefined);

  return (
    <Host
      style={{ flex: 1 }}
      colorScheme={colorScheme === 'auto' ? undefined : colorScheme}
      seedColor={seedColor}>
      <Content
        colorScheme={colorScheme}
        seedColor={seedColor}
        setColorScheme={setColorScheme}
        setSeedColor={setSeedColor}
      />
    </Host>
  );
}

function Content({
  colorScheme,
  seedColor,
  setColorScheme,
  setSeedColor,
}: {
  colorScheme: ColorSchemeOption;
  seedColor: string | undefined;
  setColorScheme: (s: ColorSchemeOption) => void;
  setSeedColor: (s: string | undefined) => void;
}) {
  const colors = useMaterialColors();

  const tokens = useMemo(
    () => (Object.entries(colors) as [keyof MaterialColors, string][]).sort(),
    [colors]
  );

  return (
    <LazyColumn
      verticalArrangement={{ spacedBy: 12 }}
      modifiers={[padding(16, 16, 16, 16), fillMaxWidth()]}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Material 3 colors</Text>
      <Text style={{ fontSize: 14 }}>
        Wallpaper-based dynamic colors: {isDynamicColorAvailable ? 'available' : 'not available'}
      </Text>

      <Text style={{ fontSize: 16, fontWeight: '600' }}>Appearance</Text>
      <SingleChoiceSegmentedButtonRow>
        {COLOR_SCHEMES.map((option) => (
          <SegmentedButton
            key={option}
            selected={colorScheme === option}
            onClick={() => setColorScheme(option)}>
            <SegmentedButton.Label>
              <Text>{option}</Text>
            </SegmentedButton.Label>
          </SegmentedButton>
        ))}
      </SingleChoiceSegmentedButtonRow>

      <Text style={{ fontSize: 16, fontWeight: '600' }}>Seed color</Text>
      <FlowRow horizontalArrangement={{ spacedBy: 8 }} verticalArrangement={{ spacedBy: 8 }}>
        {SEED_PRESETS.map((preset) => {
          const isSelected = seedColor === preset.value;
          const bg = preset.value ?? '#BDBDBD';
          const labelColor = preset.value ? '#FFFFFF' : '#000000';
          return (
            <Box
              key={preset.name}
              contentAlignment="center"
              modifiers={[
                size(88, 40),
                background(bg),
                border(isSelected ? 3 : 1, isSelected ? colors.primary : '#33000000'),
                clickable(() => setSeedColor(preset.value)),
              ]}>
              <Text color={labelColor} style={{ fontSize: 13, fontWeight: '600' }}>
                {preset.name}
              </Text>
            </Box>
          );
        })}
      </FlowRow>

      <Text style={{ fontSize: 16, fontWeight: '600' }}>Compose components</Text>
      <Text>These native buttons inherit the palette from Host.</Text>
      <Row horizontalArrangement={{ spacedBy: 8 }}>
        <Button onClick={() => {}}>
          <Text>Filled</Text>
        </Button>
        <FilledTonalButton onClick={() => {}}>
          <Text>Tonal</Text>
        </FilledTonalButton>
        <OutlinedButton onClick={() => {}}>
          <Text>Outlined</Text>
        </OutlinedButton>
      </Row>

      <Text style={{ fontSize: 16, fontWeight: '600' }}>Palette</Text>
      {tokens.map(([name, value]) => (
        <Row
          key={name}
          verticalAlignment="center"
          horizontalArrangement={{ spacedBy: 12 }}
          modifiers={[fillMaxWidth()]}>
          <Box modifiers={[size(40, 40), background(value), border(1, '#33000000')]} />
          <Column>
            <Text style={{ fontSize: 14, fontWeight: '500' }}>{name}</Text>
            <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>{value}</Text>
          </Column>
        </Row>
      ))}
    </LazyColumn>
  );
}

MaterialColorsScreen.navigationOptions = {
  title: 'Material Colors',
};
