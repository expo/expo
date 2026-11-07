import { ApiCheck } from '@/components/ApiCheck';
import type { ApiRequest } from '@/hooks/useApiCheck';

const request: ApiRequest = { method: 'GET', path: '/api/1/2/3' };

export default function GetSpreadCheck() {
  return <ApiCheck handler="[...spread]+api.ts" request={request} />;
}
