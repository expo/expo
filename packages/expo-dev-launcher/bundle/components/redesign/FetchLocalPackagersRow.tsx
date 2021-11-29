import { RefreshIcon, Button, Text, Row, Spacer } from 'expo-dev-client-components';
import * as React from 'react';

import { useExpoTheme } from '../../hooks/useExpoTheme';
import { PulseIndicator } from './PulseIndicator';

type FetchLocalPackagersRowProps = {
  isFetching: boolean;
  onRefetchPress: () => void;
};

export function FetchLocalPackagersRow({
  isFetching,
  onRefetchPress,
}: FetchLocalPackagersRowProps) {
  const theme = useExpoTheme();
  const backgroundColor = isFetching ? theme.status.info : theme.status.default;

  return (
    <Button onPress={onRefetchPress} disabled={isFetching}>
      <Row align="center" padding="medium">
        <PulseIndicator isActive={isFetching} color={backgroundColor} />
        <Spacer.Horizontal size="small" />
        <Text size="large">
          {isFetching ? 'Searching for local servers...' : 'Refetch local servers'}
        </Text>
        <Spacer.Horizontal size="flex" />
        {!isFetching && <RefreshIcon size={16} />}
      </Row>
    </Button>
  );
}
