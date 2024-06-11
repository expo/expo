import React from 'react';
import { Text } from 'react-native';

export default function Page() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <>
      <Text testID="index-text">Index</Text>
      {/* Sanity to test that hydration errors are caught in the E2E test */}
      {/* <Text testID="index-text">Index {Date.now()}</Text> */}
      {mounted && <Text testID="index-mounted">Mounted</Text>}
    </>
  );
}
