import { View, Button, Row, scale } from 'expo-dev-client-components';
import * as React from 'react';

type ButtonProps = React.ComponentProps<typeof Button.ScaleOnPressContainer>;

type BasicButtonProps = ButtonProps & {
  label: string;
  type?: ButtonProps['bg'];
};

export function BasicButton({
  label,
  type = 'tertiary',
  py = '2',
  px = '3',
  children,
  ...props
}: BasicButtonProps) {
  return (
    <View align="start">
      <Button.ScaleOnPressContainer bg={type} {...props}>
        <View py={py} px={px}>
          <Row align="center" style={{ minHeight: scale.large }}>
            <Button.Text weight="medium" color={type as any}>
              {label}
            </Button.Text>

            {children}
          </Row>
        </View>
      </Button.ScaleOnPressContainer>
    </View>
  );
}
