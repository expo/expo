import { buildChangeEvent, type SegmentedControlProps } from './types';
import { Host } from '../../jetpack-compose/Host';
import {
  SingleChoiceSegmentedButtonRow,
  SegmentedButton,
} from '../../jetpack-compose/SegmentedButton';
import { Text } from '../../jetpack-compose/Text';

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
  } = props;

  const handleClick = (index: number) => {
    const val = values?.[index] ?? '';
    onValueChange?.(val);
    onChange?.(buildChangeEvent(index, val));
  };

  const colors = tintColor ? { activeContainerColor: tintColor } : undefined;

  return (
    <Host matchContents={{ vertical: true }} style={style} colorScheme={appearance}>
      <SingleChoiceSegmentedButtonRow>
        {(values ?? []).map((label, index) => (
          <SegmentedButton
            key={index}
            selected={index === selectedIndex}
            onClick={() => handleClick(index)}
            enabled={enabled}
            colors={colors}>
            <SegmentedButton.Label>
              <Text>{label}</Text>
            </SegmentedButton.Label>
          </SegmentedButton>
        ))}
      </SingleChoiceSegmentedButtonRow>
    </Host>
  );
}
