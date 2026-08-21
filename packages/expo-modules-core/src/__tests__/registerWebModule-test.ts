import { NativeModule } from '../NativeModule';
import { registerWebModule } from '../registerWebModule';

class CounterModule extends NativeModule {
  count = 0;

  increment(): number {
    this.count += 1;
    return this.count;
  }
}

describe('registerWebModule', () => {
  it('returns an instance of the module class', () => {
    const module = registerWebModule(CounterModule, 'CounterModuleInstance');

    expect(module).toBeInstanceOf(CounterModule);
    expect(module.count).toBe(0);
    expect(module.increment()).toBe(1);
  });

  it('returns the same singleton for repeated registrations', () => {
    const first = registerWebModule(CounterModule, 'CounterModuleSingleton');
    const second = registerWebModule(CounterModule, 'CounterModuleSingleton');

    expect(second).toBe(first);
    first.increment();
    expect(second.count).toBe(first.count);
  });
});
