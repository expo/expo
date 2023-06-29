import express from 'express';
import http from 'http';

/** Headers */
export type ServerHeaders = Map<string, number | string | readonly string[]>;
/** Request */
export type ServerRequest = express.Request | http.IncomingMessage;
/** Response */
export type ServerResponse = express.Response | http.ServerResponse;
/** Next function */
export type ServerNext = (err?: Error) => void;
/** Middleware */
export type ServerMiddleware = (
  req: ServerRequest,
  res: ServerResponse,
  next: ServerNext
) => Promise<void>;
