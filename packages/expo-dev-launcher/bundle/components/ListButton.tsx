import { View, Button } from 'expo-dev-client-components';
import * as React from 'react';

type ButtonProps = React.ComponentProps<typeof Button.FadeOnPressContainer>;

export type ListButtonProps = ButtonProps & {
  children?: React.ReactNode;
  onPress: () => void;
  isFirst?: boolean;
  isLast?: boolean;
};

export function ListButton({
  children,
  onPress,
  isFirst,
  isLast,
  ...buttonProps
}: ListButtonProps) {
  return (
    <Button.FadeOnPressContainer
      bg="default"
      onPress={onPress}
      roundedBottom={isLast ? 'large' : 'none'}
      roundedTop={isFirst ? 'large' : 'none'}
      {...buttonProps}>
      <View
        bg="default"
        roundedTop={isFirst ? 'large' : 'none'}
        roundedBottom={isLast ? 'large' : 'none'}
        py="small"
        px="small">
        {children}
      </View>
    </Button.FadeOnPressContainer>
  );
}
