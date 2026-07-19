import { Link } from 'expo-router';
import React from 'react';

export default function SecondRoute() {
  // Test hooks to ensure they don't break the export.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setLoading] = React.useState(true);

  return <Link href="/">Index</Link>;
}
