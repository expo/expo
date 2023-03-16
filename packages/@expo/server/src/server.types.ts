import http from 'http';

/** Headers */
export type ServerHeaders = Map<string, number | string | readonly string[]>;
/** Request */
export type ServerRequest = http.IncomingMessage;
/** Response */
export type ServerResponse = http.ServerResponse;
/** Next function */
export type ServerNext = (err?: Error) => void;
