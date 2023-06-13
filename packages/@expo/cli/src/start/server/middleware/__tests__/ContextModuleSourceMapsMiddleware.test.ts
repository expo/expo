import { ContextModuleSourceMapsMiddleware } from '../ContextModuleSourceMapsMiddleware';

it(`should return a noop response for the sourcemap`, () => {
  const middleware = new ContextModuleSourceMapsMiddleware();

  const writeHead = jest.fn();
  const end = jest.fn();
  middleware.getHandler()(
    {
      url: '/app/ctx%3Fctx=abcde1234TERSE.map?platform=web',
      method: 'GET',
    } as any,
    {
      writeHead,
      end,
    } as any,
    jest.fn()
  );

  expect(writeHead).toBeCalledWith(200, {
    'Content-Type': 'application/json',
  });

  expect(end).toBeCalledWith('{}');
});
it(`should skip unrelated requests`, () => {
  const middleware = new ContextModuleSourceMapsMiddleware();

  const writeHead = jest.fn();
  const end = jest.fn();
  const next = jest.fn();
  middleware.getHandler()(
    {
      url: '/app/ctx.map?platform=web',
      method: 'GET',
    } as any,
    {
      writeHead,
      end,
    } as any,
    next
  );

  expect(writeHead).not.toBeCalled();
  expect(end).not.toBeCalled();

  expect(next).toBeCalled();
});
