import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useRouterMetricsHelpers } from '@/router-metrics-integration';
import { Button } from '../../../components/Button';
import { JSAnimation } from '../../../components/JSAnimation';

export default function Debug() {
  const [showAnimation, setShowAnimation] = useState(false);

  const { markPageInteractive } = useRouterMetricsHelpers();

  useEffect(() => {
    setTimeout(() => {
      markPageInteractive();
    }, 1000);
  }, [markPageInteractive]);

  return (
    <View style={styles.container}>
      <Button
        title={showAnimation ? 'Hide JS Animation' : 'Show JS Animation'}
        onPress={() => setShowAnimation(!showAnimation)}
      />
      {showAnimation && <JSAnimation />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
});
