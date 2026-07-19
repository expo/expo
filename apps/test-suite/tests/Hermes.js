export const name = 'Hermes';

export function test(t) {
  t.describe('Hermes', () => {
    t.it('defines HermesInternal', () => {
      t.expect(global.HermesInternal).toBeDefined();
    });
  });
}
