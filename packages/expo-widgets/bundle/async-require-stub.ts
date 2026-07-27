{
  type AsyncRequireStub = {
    (): Promise<never>;
    prefetch: () => void;
    unstable_importMaybeSync: () => never;
    unstable_resolve: () => never;
    unstable_createWorker: () => never;
  };

  const asyncRequireStub = function () {
    return Promise.reject(
      new Error('Async imports are not supported while extracting widget layouts.')
    );
  } as AsyncRequireStub;

  asyncRequireStub.prefetch = function prefetch() {};
  asyncRequireStub.unstable_importMaybeSync = function unstableImportMaybeSync() {
    throw new Error('Async imports are not supported while extracting widget layouts.');
  };
  asyncRequireStub.unstable_resolve = function unstableResolve() {
    throw new Error('Async imports are not supported while extracting widget layouts.');
  };
  asyncRequireStub.unstable_createWorker = function unstableCreateWorker() {
    throw new Error('Workers are not supported while extracting widget layouts.');
  };

  module.exports = asyncRequireStub;
}
