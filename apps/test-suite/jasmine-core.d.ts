declare module 'jasmine-core/lib/jasmine-core/jasmine' {
  /**
   * The jasmine interface that `TestScreen` passes to every test module as the
   * first argument of its exported `test` function. Test modules either take it
   * whole (`test(t: JasmineInterface)`) or destructure the parts they use
   * (`test({ describe, expect, it }: JasmineInterface)`).
   */
  export type JasmineInterface = {
    describe(description: string, specDefinitions: () => void): void;
    fdescribe(description: string, specDefinitions: () => void): void;
    xdescribe(description: string, specDefinitions: () => void): void;
    it(expectation: string, assertion?: jasmine.ImplementationCallback, timeout?: number): void;
    fit(expectation: string, assertion?: jasmine.ImplementationCallback, timeout?: number): void;
    xit(expectation: string, assertion?: jasmine.ImplementationCallback, timeout?: number): void;
    beforeEach(action: jasmine.ImplementationCallback, timeout?: number): void;
    afterEach(action: jasmine.ImplementationCallback, timeout?: number): void;
    beforeAll(action: jasmine.ImplementationCallback, timeout?: number): void;
    afterAll(action: jasmine.ImplementationCallback, timeout?: number): void;
    expect<T>(actual: T): jasmine.Matchers<T>;
    expectAsync<T>(actual: T | PromiseLike<T>): jasmine.AsyncMatchers<T, T>;
    fail(message?: string | Error): void;
    pending(reason?: string): void;
    spyOn<T extends object>(object: T, method: keyof T): jasmine.Spy;
    /**
     * The jasmine namespace object, carrying `DEFAULT_TIMEOUT_INTERVAL` and the
     * asymmetric matchers such as `objectContaining` and `arrayContaining`.
     */
    jasmine: typeof jasmine;
    [key: string]: unknown;
  };

  type GlobalErrorsConstructor = new (...args: unknown[]) => {
    install(): void;
    uninstall(): void;
  };

  const jasmineRequire: {
    core(self: unknown): {
      getEnv(options?: {
        suppressLoadErrors?: boolean;
        GlobalErrors?: GlobalErrorsConstructor;
      }): jasmine.Env;
    };
    interface(core: unknown, env: jasmine.Env): JasmineInterface;
  };
  export default jasmineRequire;
}
