import { Link } from 'expo-router';
import { Text, View } from 'react-native';

const examples = [
  ['Layout export', '/layout-export'],
  ['Navigator prop', '/navigator-prop'],
  ['Inherited fallback', '/inherited'],
  ['Reset fallback', '/reset'],
] as const;

export default function SuspenseFallbackExamples() {
  return (
    <View style={{ gap: 16, padding: 24 }}>
      <Text testID="index-content">Suspense fallback examples</Text>
      {examples.map(([label, href]) => (
        <Link key={href} href={href} testID={`link-${href.slice(1)}`}>
          {label}
        </Link>
      ))}
    </View>
  );
}
