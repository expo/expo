import { ApiCheck } from '@/components/ApiCheck';
import type { ApiRequest } from '@/hooks/useApiCheck';

const request: ApiRequest = { method: 'GET', path: '/api/methods' };

export default function GetMethodsCheck() {
  return <ApiCheck handler="methods+api.ts" request={request} />;
}
