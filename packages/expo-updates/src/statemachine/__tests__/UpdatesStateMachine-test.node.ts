import { interpret } from 'xstate';

import { UpdatesStateMachine } from '../UpdatesStateMachine';

describe('Updates state machine tests', () => {
  it('should transition to the checking state', (done) => {
    const machine = interpret(UpdatesStateMachine)
      .onTransition((state) => {
        if (state.value === 'checking') {
          expect(state.context.isChecking).toBe(true);
          done();
        }
      })
      .start();
    machine.send({ type: 'CHECK' });
  });
  it('should set updateAvailable when new update found', (done) => {
    const testUpdateId = '00000-xxxx';
    let isChecking = false;
    const machine = interpret(UpdatesStateMachine)
      .onTransition((state) => {
        if (state.value === 'checking') {
          isChecking = true;
        } else if (state.value === 'idle' && isChecking) {
          expect(state.context.isChecking).toBe(false);
          expect(state.context.checkError).toBeUndefined();
          expect(state.context.latestUpdateId).toEqual(testUpdateId);
          done();
        }
      })
      .start();
    machine.send({ type: 'CHECK' });
    machine.send({ type: 'CHECK_COMPLETE_AVAILABLE_NEW', updateId: testUpdateId });
  });
});
