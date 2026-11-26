import { ApiCheck } from '@/components/ApiCheck';
import type { ApiRequest } from '@/hooks/useApiCheck';

const request: ApiRequest = { method: 'GET', path: '/api/runtime' };

export default function GetRuntimeCheck() {
  return <ApiCheck handler="runtime+api.ts" request={request} />;
}
