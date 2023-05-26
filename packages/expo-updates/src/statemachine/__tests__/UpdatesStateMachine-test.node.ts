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
          expect(state.context.isUpdateAvailable).toBe(true);
          expect(state.context.isUpdatePending).toBe(false);
          done();
        }
      })
      .start();
    machine.send({ type: 'CHECK' });
    machine.send({ type: 'CHECK_COMPLETE_AVAILABLE_NEW', updateId: testUpdateId });
  });

  it('should transition to downloading state', (done) => {
    const machine = interpret(UpdatesStateMachine)
      .onTransition((state) => {
        if (state.value === 'downloading') {
          expect(state.context.isDownloading).toBe(true);
          done();
        }
      })
      .start();
    machine.send({ type: 'DOWNLOAD' });
  });

  it('should see updatePending when new update downloaded', (done) => {
    const testUpdateId = '00000-xxxx';
    let isDownloading = false;
    const machine = interpret(UpdatesStateMachine)
      .onTransition((state) => {
        if (state.value === 'downloading') {
          isDownloading = true;
        } else if (state.value === 'idle' && isDownloading) {
          expect(state.context.isChecking).toBe(false);
          expect(state.context.checkError).toBeUndefined();
          expect(state.context.latestUpdateId).toEqual(testUpdateId);
          expect(state.context.downloadedUpdateId).toEqual(testUpdateId);
          expect(state.context.isUpdateAvailable).toBe(true);
          expect(state.context.isUpdatePending).toBe(true);
          done();
        }
      })
      .start();
    machine.send({ type: 'DOWNLOAD' });
    machine.send({ type: 'DOWNLOAD_COMPLETE_NEW', updateId: testUpdateId });
  });

  it('should see updatePending but no update available', (done) => {
    const testUpdateId = '00000-xxxx';
    let isDownloading = false;
    let isChecking = false;
    const machine = interpret(UpdatesStateMachine)
      .onTransition((state) => {
        if (state.value === 'checking') {
          isChecking = true;
        }
        if (state.value === 'downloading') {
          isDownloading = true;
        } else if (state.value === 'idle' && isChecking && isDownloading) {
          expect(state.context.isChecking).toBe(false);
          expect(state.context.checkError).toBeUndefined();
          expect(state.context.latestUpdateId).toBeUndefined();
          expect(state.context.downloadedUpdateId).toEqual(testUpdateId);
          expect(state.context.isUpdateAvailable).toBe(false);
          expect(state.context.isUpdatePending).toBe(true);
          done();
        }
      })
      .start();
    machine.send({ type: 'DOWNLOAD' });
    machine.send({ type: 'DOWNLOAD_COMPLETE_NEW', updateId: testUpdateId });
    machine.send({ type: 'CHECK' });
    machine.send({ type: 'CHECK_COMPLETE_UNAVAILABLE' });
  });
});
