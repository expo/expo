import {
  BasicAlertDialog,
  Column,
  RadioButton,
  Row,
  Spacer,
  Surface,
  Text,
  TextButton,
} from '@expo/ui/jetpack-compose';
import {
  align,
  clip,
  fillMaxWidth,
  height,
  padding,
  paddingAll,
  selectable,
  Shapes,
  wrapContentHeight,
  wrapContentWidth,
} from '@expo/ui/jetpack-compose/modifiers';
import { useState } from 'react';

export interface ThemeOption {
  key: string;
  label: string;
}

interface ThemeDialogProps {
  options: ThemeOption[];
  selectedKey: string;
  onDismiss: () => void;
  onConfirm: (key: string) => void;
}

export function ThemeDialog({ options, selectedKey, onDismiss, onConfirm }: ThemeDialogProps) {
  const [selected, setSelected] = useState(selectedKey);

  return (
    <BasicAlertDialog onDismissRequest={onDismiss}>
      <Surface tonalElevation={6} modifiers={[wrapContentWidth(), wrapContentHeight()]}>
        <Column modifiers={[paddingAll(24)]}>
          <Text style={{ typography: 'headlineSmall' }}>Choose theme</Text>

          <Spacer modifiers={[height(16)]} />

          <Column>
            {options.map((option) => (
              <Row
                key={option.key}
                verticalAlignment="center"
                modifiers={[
                  fillMaxWidth(),
                  height(56),
                  clip(Shapes.RoundedCorner(16)),
                  selectable(option.key === selected, () => setSelected(option.key)),
                  padding(16, 0, 16, 0),
                ]}>
                <RadioButton selected={option.key === selected} />
                <Text style={{ typography: 'bodyLarge' }} modifiers={[padding(16, 0, 0, 0)]}>
                  {option.label}
                </Text>
              </Row>
            ))}
          </Column>

          <Spacer modifiers={[height(24)]} />

          <Row modifiers={[align('end')]}>
            <TextButton onPress={onDismiss}>Cancel</TextButton>
            <TextButton
              onPress={() => {
                onDismiss();
                onConfirm(selected);
              }}>
              OK
            </TextButton>
          </Row>
        </Column>
      </Surface>
    </BasicAlertDialog>
  );
}
