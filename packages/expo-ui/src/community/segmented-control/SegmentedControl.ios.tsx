import { Host } from '../../swift-ui/Host';
import { Picker } from '../../swift-ui/Picker';
import { Text } from '../../swift-ui/Text';
import {
  accessibilityLabel as accessibilityLabelModifier,
  disabled as disabledModifier,
} from '../../swift-ui/modifiers';
import { createModifier } from '../../swift-ui/modifiers/createModifier';
import { environment } from '../../swift-ui/modifiers/environment';
import { pickerStyle } from '../../swift-ui/modifiers/pickerStyle';
import { tag } from '../../swift-ui/modifiers/tag';
import type { ModifierConfig } from '../../types';
import { buildChangeEvent, type SegmentedControlProps } from './types';

export function SegmentedControl(props: SegmentedControlProps) {
  const {
    values,
    selectedIndex,
    enabled = true,
    onChange,
    onValueChange,
    tintColor,
    appearance,
    style,
    testID,
    accessibilityLabel,
  } = props;

  const modifiers: ModifierConfig[] = [pickerStyle('segmented')];
  if (!enabled) {
    modifiers.push(disabledModifier());
  }
  if (accessibilityLabel) {
    modifiers.push(accessibilityLabelModifier(accessibilityLabel));
  }
  if (tintColor) {
    modifiers.push(createModifier('selectedSegmentTintColor', { color: tintColor }));
  }
  if (appearance) {
    modifiers.push(environment('colorScheme', appearance));
  }

  const handleSelectionChange = (selection: number) => {
    const val = values?.[selection] ?? '';
    onValueChange?.(val);
    onChange?.(buildChangeEvent(selection, val));
  };

  return (
    <Host matchContents={{ vertical: true }} style={style} ignoreSafeArea="all">
      <Picker
        selection={selectedIndex}
        onSelectionChange={handleSelectionChange}
        modifiers={modifiers}
        label=""
        testID={testID}>
        {(values ?? []).map((label, index) => (
          <Text key={index} modifiers={[tag(index)]}>
            {label}
          </Text>
        ))}
      </Picker>
    </Host>
  );
}
