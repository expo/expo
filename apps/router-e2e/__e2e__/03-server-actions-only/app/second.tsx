import React from 'react';
import { Link } from 'expo-router';

export default function SecondRoute() {
  // Test hooks to ensure they don't break the export.
  const [isLoading, setLoading] = React.useState(true);

  return <Link href="/">Index</Link>;
}
