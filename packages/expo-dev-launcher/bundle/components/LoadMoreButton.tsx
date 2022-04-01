import { View, Button } from 'expo-dev-client-components';
import * as React from 'react';
import { StyleSheet } from 'react-native';

import { ActivityIndicator } from './ActivityIndicator';

type LoadMoreButtonProps = {
  isLoading: boolean;
  onPress: () => void;
};

export function LoadMoreButton({ isLoading, onPress }: LoadMoreButtonProps) {
  return (
    <View py="medium" align="centered">
      <Button.ScaleOnPressContainer bg="primary" onPress={onPress}>
        <View px="2.5" py="2">
          <Button.Text weight="medium" color="primary">
            Load More
          </Button.Text>
          {isLoading && (
            <View style={StyleSheet.absoluteFill} align="centered">
              <ActivityIndicator />
            </View>
          )}
        </View>
      </Button.ScaleOnPressContainer>
    </View>
  );
}
