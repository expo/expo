import { ApiCheck } from '@/components/ApiCheck';
import type { ApiRequest } from '@/hooks/useApiCheck';

const request: ApiRequest = { method: 'POST', path: '/api/methods' };

export default function PostMethodsCheck() {
  return <ApiCheck handler="methods+api.ts" request={request} />;
}
