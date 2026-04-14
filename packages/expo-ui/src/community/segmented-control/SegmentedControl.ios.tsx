import { buildChangeEvent, type SegmentedControlProps } from './types';
import { Host } from '../../swift-ui/Host';
import { Picker } from '../../swift-ui/Picker';
import { Text } from '../../swift-ui/Text';
import { disabled as disabledModifier } from '../../swift-ui/modifiers';
import { environment } from '../../swift-ui/modifiers/environment';
import { pickerStyle } from '../../swift-ui/modifiers/pickerStyle';
import { tag } from '../../swift-ui/modifiers/tag';
import type { ModifierConfig } from '../../types';

export function SegmentedControl(props: SegmentedControlProps) {
  const {
    values,
    selectedIndex,
    enabled = true,
    onChange,
    onValueChange,
    appearance,
    style,
    testID,
  } = props;

  const modifiers: ModifierConfig[] = [pickerStyle('segmented')];
  if (!enabled) {
    modifiers.push(disabledModifier());
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
    <Host matchContents={{ vertical: true }} style={style}>
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
