import { View, Button, Row, scale } from 'expo-dev-client-components';
import * as React from 'react';
import { StyleSheet } from 'react-native';

import { ActivityIndicator } from '../components/ActivityIndicator';

type ButtonProps = React.ComponentProps<typeof Button.FadeOnPressContainer>;

type BasicButtonProps = ButtonProps & {
  label: string;
  type?: ButtonProps['bg'];
  size?: 'medium' | 'small';
  isLoading?: boolean;
  onPress?: () => void;
};

const sizeMap: Record<'medium' | 'small', any> = {
  medium: {
    px: '3',
    py: '2',
  },
  small: {
    px: '2',
    py: '1',
  },
};

export function BasicButton({
  label,
  type = 'tertiary',
  size = 'medium',
  children,
  isLoading,
  ...props
}: BasicButtonProps) {
  return (
    <View align="start">
      <View>
        <View opacity={isLoading ? '0.5' : '1'}>
          <Button.FadeOnPressContainer bg={type} {...props}>
            <View {...sizeMap[size]}>
              <Row align="center" style={{ minHeight: scale.large }}>
                <Button.Text weight="medium" color={type as any} size={size}>
                  {label}
                </Button.Text>

                {children}
              </Row>
            </View>
          </Button.FadeOnPressContainer>
        </View>
        {isLoading && (
          <View
            style={{
              ...StyleSheet.absoluteFillObject,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <ActivityIndicator size="small" />
          </View>
        )}
      </View>
    </View>
  );
}
