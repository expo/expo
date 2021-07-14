import Checkbox, { CheckboxProps } from 'expo-checkbox';
import { Container } from 'expo-stories/components';
import * as React from 'react';

function CheckboxExample(props: CheckboxProps) {
  const [value, setValue] = React.useState(false);

  return (
    <Container>
      <Checkbox value={value} onValueChange={setValue} {...props} />
    </Container>
  );
}

export const Basic = () => <CheckboxExample />;

export const CustomColor = () => <CheckboxExample color="#4630EB" />;

CustomColor.storyConfig = {
  name: 'Rendering Custom Colors',
};

export const Disabled = () => <CheckboxExample disabled />;

export const Styled = () => <CheckboxExample style={{ height: 32, width: 32 }} />;

export default {
  title: 'Expo Checkbox',
};
