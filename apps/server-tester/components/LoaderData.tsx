import { Json } from './Json';
import { Panel } from './Panel';
import { Section } from './Section';

interface LoaderDataProps {
  value: unknown;
}

export function LoaderData({ value }: LoaderDataProps) {
  return (
    <Section title="Loader data">
      <Panel>
        <Json value={value} testID="loader-result" />
      </Panel>
    </Section>
  );
}
