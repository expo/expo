import React from 'react';
import { Link } from 'expo-router';

export default function SecondRoute() {
  // Test hooks to ensure they don't break the export.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setLoading] = React.useState(true);

  return <Link href="/">Index</Link>;
}
