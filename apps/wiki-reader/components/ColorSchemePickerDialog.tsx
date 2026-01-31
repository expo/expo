import {
  BasicAlertDialog,
  Column,
  Icon,
  IconButton,
  Row,
  Spacer,
  Surface,
  Text,
  TextButton,
} from '@expo/ui/jetpack-compose';
import {
  align,
  height,
  paddingAll,
  size,
  wrapContentHeight,
  wrapContentWidth,
} from '@expo/ui/jetpack-compose/modifiers';

export const COLOR_SCHEMES = [
  '#feb4a7',
  '#ffb3c0',
  '#fcaaff',
  '#b9c3ff',
  '#62d3ff',
  '#44d9f1',
  '#52dbc9',
  '#78dd77',
  '#9fd75c',
  '#c1d02d',
  '#fabd00',
  '#ffb86e',
  '#ffffff',
];

interface ColorPickerButtonProps {
  color: string;
  isSelected: boolean;
  onPress: () => void;
}

function ColorPickerButton({ color, isSelected, onPress }: ColorPickerButtonProps) {
  const icon = isSelected ? (
    <Icon source={require('@/assets/symbols/check.xml')} tintColor="#000000" />
  ) : color === '#ffffff' ? (
    <Icon source={require('@/assets/symbols/colors.xml')} tintColor="#000000" />
  ) : undefined;

  return (
    <IconButton
      onPress={onPress}
      elementColors={{ containerColor: color }}
      modifiers={[paddingAll(4), size(48, 48)]}>
      {icon}
    </IconButton>
  );
}

interface ColorSchemePickerDialogProps {
  currentColor: string;
  onDismiss: () => void;
  onColorChange: (color: string) => void;
}

export function ColorSchemePickerDialog({
  currentColor,
  onDismiss,
  onColorChange,
}: ColorSchemePickerDialogProps) {
  const gridColors = COLOR_SCHEMES.slice(0, -1);
  const rows = Array.from({ length: gridColors.length / 4 }, (_, i) =>
    gridColors.slice(i * 4, i * 4 + 4)
  );

  return (
    <BasicAlertDialog onDismissRequest={onDismiss}>
      <Surface modifiers={[wrapContentWidth(), wrapContentHeight()]}>
        <Column modifiers={[paddingAll(24)]} horizontalAlignment="center">
          <Text style={{ typography: 'headlineSmall' }}>Choose color scheme</Text>

          <Spacer modifiers={[height(16)]} />

          <Column horizontalAlignment="center">
            {rows.map((row, rowIndex) => (
              <Row key={rowIndex}>
                {row.map((color) => (
                  <ColorPickerButton
                    key={color}
                    color={color}
                    isSelected={color === currentColor}
                    onPress={() => onColorChange(color)}
                  />
                ))}
              </Row>
            ))}
            <ColorPickerButton
              color={COLOR_SCHEMES[COLOR_SCHEMES.length - 1]}
              isSelected={COLOR_SCHEMES[COLOR_SCHEMES.length - 1] === currentColor}
              onPress={() => onColorChange(COLOR_SCHEMES[COLOR_SCHEMES.length - 1])}
            />
          </Column>

          <Spacer modifiers={[height(24)]} />

          <TextButton onPress={onDismiss} modifiers={[align('end')]}>
            OK
          </TextButton>
        </Column>
      </Surface>
    </BasicAlertDialog>
  );
}
