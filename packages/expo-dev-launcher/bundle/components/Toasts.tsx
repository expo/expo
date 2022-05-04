import { View, Text, WarningIcon, Row, Spacer, Heading } from 'expo-dev-client-components';
import * as React from 'react';

function ErrorToast({ children }) {
  return (
    <View mx="large">
      <View bg="error" padding="medium" rounded="medium" border="error">
        <View>
          <Text color="error" numberOfLines={4}>
            {children}
          </Text>
        </View>
      </View>
    </View>
  );
}

function WarningToast({ children }) {
  return (
    <View mx="large">
      <View bg="warning" padding="medium" rounded="medium" border="warning">
        <Row align="center">
          <WarningIcon />

          <Spacer.Horizontal size="tiny" />

          <Heading color="warning" size="small" style={{ top: 1 }}>
            Warning
          </Heading>
        </Row>

        <Spacer.Vertical size="small" />

        <View>
          <Text size="small" color="warning">
            {children}
          </Text>
        </View>
      </View>
    </View>
  );
}

function InfoToast({ children }) {
  return (
    <View mx="large">
      <View bg="default" padding="medium" rounded="medium" border="default">
        <View>
          <Text color="default">{children}</Text>
        </View>
      </View>
    </View>
  );
}

export const Toasts = {
  Error: ErrorToast,
  Warning: WarningToast,
  Info: InfoToast,
};
