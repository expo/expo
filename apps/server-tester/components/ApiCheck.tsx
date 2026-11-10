import { ApiRequest, useApiCheck } from '@/hooks/useApiCheck';

import { Json } from './Json';
import { Page } from './Page';
import { Panel } from './Panel';
import { PanelGroup } from './PanelGroup';
import { Section } from './Section';

interface ApiCheckProps {
  handler: string;
  request: ApiRequest;
}

export function ApiCheck({ handler, request }: ApiCheckProps) {
  const result = useApiCheck(request);
  return (
    <Page title={`${request.method} ${request.path}`} testID="api-check">
      <PanelGroup>
        <Section title="Request">
          <Panel>
            <Json value={{ ...request, body: request.body ?? null, handler }} />
          </Panel>
        </Section>
        <Section title="Response">
          <Panel>
            <Json value={result ?? 'pending'} testID="api-check-result" />
          </Panel>
        </Section>
      </PanelGroup>
    </Page>
  );
}
