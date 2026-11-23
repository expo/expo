import { ApiCheck } from '@/components/ApiCheck';
import type { ApiRequest } from '@/hooks/useApiCheck';

const request: ApiRequest = { method: 'GET', path: '/api/abc' };

export default function GetDynamicCheck() {
  return <ApiCheck handler="[dynamic]+api.ts" request={request} />;
}
