import { Host } from '../../jetpack-compose/Host';
import {
  SingleChoiceSegmentedButtonRow,
  SegmentedButton,
} from '../../jetpack-compose/SegmentedButton';
import { Text } from '../../jetpack-compose/Text';
import { buildChangeEvent, type SegmentedControlProps } from './types';

export function SegmentedControl(props: SegmentedControlProps) {
  const {
    values,
    selectedIndex,
    enabled = true,
    onChange,
    onValueChange,
    tintColor,
    activeTextColor,
    inactiveTextColor,
    appearance,
    style,
  } = props;

  const handleClick = (index: number) => {
    const val = values?.[index] ?? '';
    onValueChange?.(val);
    onChange?.(buildChangeEvent(index, val));
  };

  const colors = {
    ...(tintColor ? { activeContainerColor: tintColor } : undefined),
    ...(activeTextColor ? { activeContentColor: activeTextColor } : undefined),
    ...(inactiveTextColor ? { inactiveContentColor: inactiveTextColor } : undefined),
  };

  return (
    <Host matchContents={{ vertical: true }} style={style} colorScheme={appearance}>
      <SingleChoiceSegmentedButtonRow>
        {(values ?? []).map((label, index) => {
          const isSelected = index === selectedIndex;
          const textColor = isSelected ? activeTextColor : inactiveTextColor;
          return (
            <SegmentedButton
              key={index}
              selected={isSelected}
              onClick={() => handleClick(index)}
              enabled={enabled}
              colors={Object.keys(colors).length > 0 ? colors : undefined}>
              <SegmentedButton.Label>
                <Text color={textColor}>{label}</Text>
              </SegmentedButton.Label>
            </SegmentedButton>
          );
        })}
      </SingleChoiceSegmentedButtonRow>
    </Host>
  );
}
