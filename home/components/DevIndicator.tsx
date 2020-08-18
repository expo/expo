import * as React from 'react';
import { View, ViewProps } from 'react-native';

export default function DevIndicator({
  style,
  isActive,
  isNetworkAvailable,
}: {
  style: ViewProps['style'];
  isActive?: boolean;
  isNetworkAvailable?: boolean;
}) {
  const backgroundColor = React.useMemo(() => {
    if (isActive && isNetworkAvailable) {
      return '#00c100';
    } else if (!isNetworkAvailable) {
      return '#e0e057';
    }
    return '#ccc';
  }, [isNetworkAvailable, isActive]);

  return (
    <View
      style={[
        {
          width: 7,
          height: 7,
          backgroundColor,
          borderRadius: 3.5,
        },
        style,
      ]}
    />
  );
}
