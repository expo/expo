import { DevSession } from '../types';

export function getServerUrlFromDevSession(devSession: DevSession) {
  if (!devSession?.url.includes('url')) {
    return devSession?.url;
  }

  const params = decodeURIComponent(devSession.url).split(/([&,?,=])/);
  const index = params.indexOf('url');
  const value = params[index + 2];
  return value;
}
