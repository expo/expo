import * as http from 'node:http';
import type { AddressInfo } from 'node:net';
import { PassThrough } from 'node:stream';

import { respond as expressRespond } from '../express';
import { respond } from '../http';
import { respond as vercelRespond } from '../vercel';

class MockServerResponse extends PassThrough {
  statusCode = 200;
  statusMessage = '';
  readonly headers = new Map<string, string | string[]>();

  setHeader(name: string, value: string | readonly string[]) {
    this.headers.set(name.toLowerCase(), typeof value === 'string' ? value : [...value]);
    return this;
  }
}

function asServerResponse(response: MockServerResponse): http.ServerResponse {
  return response as any;
}

function createStreamingResponse(
  start: (controller: ReadableStreamDefaultController<Uint8Array>) => void,
  cancel?: (reason: unknown) => void
): Response {
  return new Response(new ReadableStream({ start, cancel }));
}

function errorWithCode(code: string): Error {
  return Object.assign(new Error(code), { code });
}

describe(respond, () => {
  it('is shared by the Express and Vercel adapters', () => {
    expect(expressRespond).toBe(respond);
    expect(vercelRespond).toBe(respond);
  });

  it('writes status, headers, and asynchronously streamed chunks', async () => {
    const response = new MockServerResponse();
    const chunks: Buffer[] = [];
    response.on('data', (chunk) => chunks.push(chunk));
    const encoder = new TextEncoder();

    await respond(
      asServerResponse(response),
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode('first'));
            queueMicrotask(() => {
              controller.enqueue(encoder.encode('-second'));
              controller.close();
            });
          },
        }),
        {
          status: 201,
          statusText: 'Created here',
          headers: [
            ['content-type', 'text/plain'],
            ['set-cookie', 'first=1'],
            ['set-cookie', 'second=2'],
          ],
        }
      )
    );

    expect(response.statusCode).toBe(201);
    expect(response.statusMessage).toBe('Created here');
    expect(response.headers.get('content-type')).toBe('text/plain');
    expect(response.headers.get('set-cookie')).toEqual(['first=1', 'second=2']);
    expect(Buffer.concat(chunks).toString()).toBe('first-second');
    expect(response.writableEnded).toBe(true);
  });

  it('ends a response without a body', async () => {
    const response = new MockServerResponse();

    await respond(asServerResponse(response), new Response(null, { status: 204 }));

    expect(response.statusCode).toBe(204);
    expect(response.writableEnded).toBe(true);
  });

  it.each(['ended', 'destroyed'] as const)('ignores an already %s response', async (state) => {
    const response = new MockServerResponse();
    if (state === 'ended') response.end();
    else response.destroy();
    const setHeader = jest.spyOn(response, 'setHeader');

    await respond(asServerResponse(response), new Response('ignored', { status: 202 }));

    expect(response.statusCode).toBe(200);
    expect(setHeader).not.toHaveBeenCalled();
  });

  it('returns when the destination closes while headers are assigned', async () => {
    class ClosingResponse extends MockServerResponse {
      override setHeader(name: string, value: string | readonly string[]) {
        const result = super.setHeader(name, value);
        this.destroy();
        return result;
      }
    }
    const response = new ClosingResponse();

    await respond(
      asServerResponse(response),
      new Response('ignored', { headers: { test: 'value' } })
    );

    expect(response.destroyed).toBe(true);
  });

  it('waits for destination backpressure', async () => {
    const response = new MockServerResponse();
    const write = jest.spyOn(response, 'write').mockImplementationOnce((chunk: any) => {
      (PassThrough.prototype.write as any).call(response, chunk);
      queueMicrotask(() => response.emit('drain'));
      return false;
    });

    await respond(asServerResponse(response), new Response('body'));

    expect(write).toHaveBeenCalled();
    expect(response.writableEnded).toBe(true);
  });

  it('stops waiting for backpressure when the destination closes', async () => {
    const response = new MockServerResponse();
    const cancel = jest.fn();
    jest.spyOn(response, 'write').mockImplementationOnce((chunk: any) => {
      (PassThrough.prototype.write as any).call(response, chunk);
      queueMicrotask(() => response.destroy());
      return false;
    });

    await respond(
      asServerResponse(response),
      createStreamingResponse((controller) => controller.enqueue(new Uint8Array([1])), cancel)
    );

    expect(cancel).toHaveBeenCalled();
  });

  it('does not stream when the signal is already aborted', async () => {
    const response = new MockServerResponse();
    const controller = new AbortController();
    controller.abort();
    const cancel = jest.fn();
    const chunks: Buffer[] = [];
    response.on('data', (chunk) => chunks.push(chunk));

    await respond(
      asServerResponse(response),
      createStreamingResponse((stream) => stream.enqueue(new Uint8Array([1])), cancel),
      { signal: controller.signal }
    );

    expect(chunks).toEqual([]);
    expect(cancel).not.toHaveBeenCalled();
    expect(response.writableEnded).toBe(true);
  });

  it('cancels the body and destroys the destination when the signal aborts', async () => {
    const response = new MockServerResponse();
    response.on('error', () => {});
    const controller = new AbortController();
    const reason = new Error('request aborted');
    const cancel = jest.fn();
    response.once('data', () => controller.abort(reason));

    await respond(
      asServerResponse(response),
      createStreamingResponse((stream) => stream.enqueue(new Uint8Array([1])), cancel),
      { signal: controller.signal }
    );

    expect(cancel).toHaveBeenCalledWith(reason);
    expect(response.destroyed).toBe(true);
  });

  it('unblocks backpressure when the signal aborts', async () => {
    const response = new MockServerResponse();
    response.on('error', () => {});
    const controller = new AbortController();
    jest.spyOn(response, 'write').mockImplementationOnce((chunk: any) => {
      (PassThrough.prototype.write as any).call(response, chunk);
      queueMicrotask(() => controller.abort());
      return false;
    });

    await respond(asServerResponse(response), new Response('body'), {
      signal: controller.signal,
    });

    expect(response.destroyed).toBe(true);
  });

  it('removes listeners and releases the body after streaming', async () => {
    const response = new MockServerResponse();
    response.resume();
    const controller = new AbortController();
    const webResponse = new Response('body');

    await respond(asServerResponse(response), webResponse, { signal: controller.signal });
    controller.abort();

    expect(response.destroyed).toBe(false);
    expect(response.listenerCount('close')).toBe(0);
    expect(webResponse.body!.locked).toBe(false);
  });

  it('returns when the destination closes with an error', async () => {
    const response = new MockServerResponse();
    response.on('error', () => {});
    const error = new Error('socket failed');
    response.once('data', () => response.destroy(error));

    await respond(
      asServerResponse(response),
      createStreamingResponse((controller) => controller.enqueue(new Uint8Array([1])))
    );

    expect(response.destroyed).toBe(true);
  });

  it('ignores an error while cancelling a closed destination', async () => {
    const response = new MockServerResponse();
    response.once('data', () => response.destroy());

    await respond(
      asServerResponse(response),
      createStreamingResponse(
        (controller) => controller.enqueue(new Uint8Array([1])),
        () => {
          throw new Error('cancel failed');
        }
      )
    );

    expect(response.destroyed).toBe(true);
  });

  it('propagates a header error', async () => {
    const response = new MockServerResponse();
    const error = new Error('headers failed');
    jest.spyOn(response, 'setHeader').mockImplementation(() => {
      throw error;
    });

    await expect(
      respond(asServerResponse(response), new Response('body', { headers: { test: 'value' } }))
    ).rejects.toBe(error);
  });

  it('propagates an uncommitted body error', async () => {
    const response = new MockServerResponse();
    response.resume();
    const error = new Error('body failed');
    const webResponse = createStreamingResponse((controller) => controller.error(error));

    await expect(respond(asServerResponse(response), webResponse)).rejects.toBe(error);

    expect(response.destroyed).toBe(false);
    expect(response.listenerCount('close')).toBe(0);
    expect(webResponse.body!.locked).toBe(false);
  });

  it('destroys the destination and propagates a committed body error', async () => {
    const response = new MockServerResponse();
    response.on('error', () => {});
    Object.defineProperty(response, 'headersSent', { value: false, writable: true });
    response.once('data', () => {
      (response as any).headersSent = true;
    });
    const error = new Error('body failed after commit');
    let pulls = 0;

    await expect(
      respond(
        asServerResponse(response),
        new Response(
          new ReadableStream({
            pull(controller) {
              if (pulls++ === 0) controller.enqueue(new Uint8Array([1]));
              else controller.error(error);
            },
          })
        )
      )
    ).rejects.toBe(error);

    expect(response.destroyed).toBe(true);
  });

  it.each(['ERR_STREAM_PREMATURE_CLOSE', 'ERR_STREAM_UNABLE_TO_PIPE', 'ECONNRESET', 'EPIPE'])(
    'propagates a source %s error',
    async (code) => {
      const response = new MockServerResponse();
      response.resume();
      const error = errorWithCode(code);

      await expect(
        respond(
          asServerResponse(response),
          createStreamingResponse((controller) => controller.error(error))
        )
      ).rejects.toBe(error);
    }
  );

  it('propagates a source AbortError', async () => {
    const response = new MockServerResponse();
    response.resume();
    const error = new DOMException('body aborted itself', 'AbortError');

    await expect(
      respond(
        asServerResponse(response),
        createStreamingResponse((controller) => controller.error(error))
      )
    ).rejects.toBe(error);
  });
});

describe('respond with an HTTP client', () => {
  function listen(server: http.Server): Promise<number> {
    return new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve((server.address() as AddressInfo).port));
    });
  }

  function close(server: http.Server): Promise<void> {
    return new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }

  it('returns when the client disconnects before respond starts', async () => {
    let received!: () => void;
    const requestReceived = new Promise<void>((resolve) => {
      received = resolve;
    });
    let complete!: () => void;
    let fail!: (error: unknown) => void;
    const handled = new Promise<void>((resolve, reject) => {
      complete = resolve;
      fail = reject;
    });
    const server = http.createServer((_request, response) => {
      received();
      response.once('close', async () => {
        try {
          await respond(response, new Response('manifest'));
          complete();
        } catch (error) {
          fail(error);
        }
      });
    });
    const port = await listen(server);
    const request = http.request({ host: '127.0.0.1', port });
    request.on('error', () => {});
    request.end();
    await requestReceived;
    request.destroy();

    await handled;
    await close(server);
  });

  it('returns and cancels the body when the client disconnects while streaming', async () => {
    let complete!: () => void;
    let fail!: (error: unknown) => void;
    const handled = new Promise<void>((resolve, reject) => {
      complete = resolve;
      fail = reject;
    });
    const cancel = jest.fn();
    const server = http.createServer(async (_request, response) => {
      try {
        await respond(
          response,
          createStreamingResponse(
            (controller) => controller.enqueue(new TextEncoder().encode('first')),
            cancel
          )
        );
        complete();
      } catch (error) {
        fail(error);
      }
    });
    const port = await listen(server);
    const request = http.get({ host: '127.0.0.1', port });
    request.on('error', () => {});
    request.once('response', (response) => {
      response.once('data', () => response.destroy());
    });

    await handled;
    expect(cancel).toHaveBeenCalled();
    await close(server);
  });
});
