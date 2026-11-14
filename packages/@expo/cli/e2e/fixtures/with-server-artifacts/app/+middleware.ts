import { setResponseHeaders } from 'expo-server';

export default function middleware() {
  setResponseHeaders({ 'x-esm-middleware': 'true' });
}
