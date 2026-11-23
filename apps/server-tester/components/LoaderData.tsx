import { Text } from 'react-native';

import { useIsMounted } from '@/hooks/useIsMounted';

import { Json } from './Json';
import { Panel } from './Panel';
import { Section } from './Section';

interface LoaderDataProps {
  value: unknown;
}

export function LoaderData({ value }: LoaderDataProps) {
  const mounted = useIsMounted();
  return (
    <Section title="Loader data">
      <Panel>
        <Json value={value} testID="loader-result" />
        {mounted && <Text style={{ display: 'none' }} testID="loader-mounted" />}
      </Panel>
    </Section>
  );
}
