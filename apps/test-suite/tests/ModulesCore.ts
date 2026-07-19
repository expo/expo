import { EventEmitter, requireNativeModule } from 'expo';

export const name = 'ModulesCore';

export function test({ describe, expect, it }) {
  describe('EventEmitter', () => {
    it('does not propagate errors from listeners', () => {
      expect(() => {
        const emitter = new EventEmitter<{ test(): void }>();
        emitter.addListener('test', () => {
          throw new Error('Error thrown from the event listener');
        });
        emitter.emit('test');
      }).not.toThrow();
    });

    it('continues executing listeners when one throws', () => {
      let subsequentListenerWasCalled: boolean = false;
      const emitter = new EventEmitter<{ test(): void }>();

      emitter.addListener('test', () => {
        throw new Error('Error thrown from the event listener');
      });
      emitter.addListener('test', () => {
        subsequentListenerWasCalled = true;
      });
      emitter.emit('test');

      expect(subsequentListenerWasCalled).toBe(true);
    });

    it('is backwards compatible when a native module is passed', () => {
      const anyModule = requireNativeModule('ExpoImage');
      const emitter = new EventEmitter(anyModule);

      expect(emitter).toBe(anyModule);
    });
  });
}
