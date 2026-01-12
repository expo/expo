import { NextHandleFunction } from 'connect';

const createCompressionMiddleware = require('compression');

const compressionMiddleware = createCompressionMiddleware();

/**
 * Compression middleware that skips compression for event stream content type
 * and explicitly set content encoding.
 */
export const compression: NextHandleFunction = (req, res, next) => {
  // if user explicitly set content encoding, we skip compression
  // this will allow users to handle content encoding themselves
  if (res.getHeader('Content-Encoding')) {
    return next();
  }

  // compression package breaks streaming responses
  // if we detect event stream content type, we skip compression
  // this is better default than breaking the streaming response
  const contentType = res.getHeader('Content-Type');
  if (
    isEventSteam(contentType) ||
    (Array.isArray(contentType) && contentType.some(isEventSteam))
  ) {
    return next();
  }

  return compressionMiddleware(req, res, next);
}

function isEventSteam(type: unknown): boolean {
  if (typeof type !== 'string') {
    return false;
  }
  return type === EVENT_STREAM_CONTENT_TYPE;
}

const EVENT_STREAM_CONTENT_TYPE = 'text/event-stream';
