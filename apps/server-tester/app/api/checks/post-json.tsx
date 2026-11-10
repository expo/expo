import { ApiCheck } from '@/components/ApiCheck';
import type { ApiRequest } from '@/hooks/useApiCheck';

const request: ApiRequest = { method: 'POST', path: '/api/json', body: { hello: 'world' } };

export default function PostJsonCheck() {
  return <ApiCheck handler="json+api.ts" request={request} />;
}
