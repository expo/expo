import { useGlobalSearchParams, usePathname, useSegments } from 'expo-router';

import { Json } from './Json';
import { Panel } from './Panel';
import { PanelGroup } from './PanelGroup';
import { Section } from './Section';

export function RouteDetails() {
  const pathname = usePathname();
  const segments = useSegments();
  const params = useGlobalSearchParams();
  return (
    <PanelGroup>
      <Section title="Route">
        <Panel>
          <Json value={{ pathname, segments }} testID="route-match" />
        </Panel>
      </Section>
      <Section title="Params">
        <Panel>
          <Json value={params} testID="route-params" />
        </Panel>
      </Section>
    </PanelGroup>
  );
}
