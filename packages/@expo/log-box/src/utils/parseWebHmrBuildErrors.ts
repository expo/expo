import {
  MetroBuildError,
  MetroPackageResolutionError,
  MetroTransformError,
} from '../Data/BuildErrors';

export function parseWebHmrBuildErrors(data: object): MetroBuildError {
  const message = [(data as any).type, (data as any).message].filter(Boolean).join(' ');

  const type: string | undefined = (data as any).type;
  const errors: any[] | undefined = (data as any).errors;

  if (
    'originModulePath' in data &&
    typeof data.originModulePath === 'string' &&
    'targetModuleName' in data &&
    typeof data.targetModuleName === 'string' &&
    'cause' in data
  ) {
    return new MetroPackageResolutionError(
      message,
      type,
      errors,
      data.originModulePath,
      data.targetModuleName,
      data.cause as any
    );
  }

  if (type === 'TransformError') {
    assert('lineNumber' in data, '[Internal] Expected lineNumber to be in Metro HMR error update');
    assert('column' in data, '[Internal] Expected column to be in Metro HMR error update');
    assert('filename' in data, '[Internal] Expected filename to be in Metro HMR error update');

    return new MetroTransformError(
      message,
      type,
      errors!,
      // @ts-ignore
      data.lineNumber,
      data.column,
      data.filename
    );
  }

  // TODO: Add import stack to the error
  // if ('stack' in data && typeof data.stack === 'string') {
  //   error.stack = stripAnsi(data.stack);
  // }

  return new MetroBuildError(message, type, errors);
}

function assert(foo: any, msg: string): asserts foo {
  if (!foo) throw new Error(msg);
}
