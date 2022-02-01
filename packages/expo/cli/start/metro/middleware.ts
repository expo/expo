import express from 'express';
import http from 'http';
import { parse } from 'url';

/** Extract the  */
export function getPlatformFromRequest(
  req: express.Request | http.IncomingMessage
): 'android' | 'ios' {
  const url = req.url ? parse(req.url, /* parseQueryString */ true) : null;
  const platform = url?.query.platform || req.headers['expo-platform'];
  if (!platform) {
    throw new Error('Must specify expo-platform header or query parameter');
  }

  const stringifiedPlatform = String(platform);
  if (!['android', 'ios'].includes(stringifiedPlatform)) {
    throw new Error(`platform must be "android" or "ios". Received: "${platform}"`);
  }
  return stringifiedPlatform as 'android' | 'ios';
}

export function getPlatformFromLegacyRequest(req: express.Request | http.IncomingMessage): string {
  return (req.headers['exponent-platform'] || 'ios').toString();
}
