import { interpret } from 'xstate';

import { UpdatesStateMachineEventTypes, UpdatesStateMachine } from '../UpdatesStateMachine';
import type { UpdatesStateMachineEvent } from '../UpdatesStateMachine';

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
    const event: UpdatesStateMachineEvent = { type: UpdatesStateMachineEventTypes.CHECK, body: {} };
    machine.send(event);
  });

  it('should set updateAvailable when new update found', (done) => {
    const testUpdateId = '00000-xxxx';
    let wasChecking = false;
    const machine = interpret(UpdatesStateMachine)
      .onTransition((state) => {
        if (state.value === 'checking') {
          wasChecking = true;
        } else if (state.value === 'idle' && wasChecking) {
          expect(state.context.isChecking).toBe(false);
          expect(state.context.checkError).toBeUndefined();
          expect(state.context.latestManifest).toEqual({ updateId: testUpdateId });
          expect(state.context.isUpdateAvailable).toBe(true);
          expect(state.context.isUpdatePending).toBe(false);
          done();
        }
      })
      .start();
    const checkEvent: UpdatesStateMachineEvent = {
      type: UpdatesStateMachineEventTypes.CHECK,
      body: {},
    };
    const checkCompleteEvent: UpdatesStateMachineEvent = {
      type: UpdatesStateMachineEventTypes.CHECK_COMPLETE_AVAILABLE,
      body: { manifest: { updateId: testUpdateId } },
    };
    machine.send(checkEvent);
    machine.send(checkCompleteEvent);
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
    const downloadEvent: UpdatesStateMachineEvent = {
      type: UpdatesStateMachineEventTypes.DOWNLOAD,
      body: {},
    };
    machine.send(downloadEvent);
  });

  it('should see updatePending when new update downloaded', (done) => {
    const testUpdateId = '00000-xxxx';
    let wasDownloading = false;
    const machine = interpret(UpdatesStateMachine)
      .onTransition((state) => {
        if (state.value === 'downloading') {
          wasDownloading = true;
        } else if (state.value === 'idle' && wasDownloading) {
          expect(state.context.isChecking).toBe(false);
          expect(state.context.checkError).toBeUndefined();
          expect(state.context.latestManifest).toEqual({ updateId: testUpdateId });
          expect(state.context.downloadedManifest).toEqual({ updateId: testUpdateId });
          expect(state.context.isUpdateAvailable).toBe(true);
          expect(state.context.isUpdatePending).toBe(true);
          done();
        }
      })
      .start();
    const downloadEvent: UpdatesStateMachineEvent = {
      type: UpdatesStateMachineEventTypes.DOWNLOAD,
      body: {},
    };
    const downloadCompleteEvent: UpdatesStateMachineEvent = {
      type: UpdatesStateMachineEventTypes.DOWNLOAD_COMPLETE,
      body: { manifest: { updateId: testUpdateId } },
    };
    machine.send(downloadEvent);
    machine.send(downloadCompleteEvent);
  });

  it('should handle rollback', (done) => {
    let wasChecking = false;
    const machine = interpret(UpdatesStateMachine)
      .onTransition((state) => {
        if (state.value === 'checking') {
          wasChecking = true;
        } else if (state.value === 'idle' && wasChecking) {
          expect(state.context.isChecking).toBe(false);
          expect(state.context.checkError).toBeUndefined();
          expect(state.context.latestManifest).toBeUndefined();
          expect(state.context.isUpdateAvailable).toBe(true);
          expect(state.context.isRollback).toBe(true);
          expect(state.context.isUpdatePending).toBe(false);
          done();
        }
      })
      .start();
    const checkEvent: UpdatesStateMachineEvent = {
      type: UpdatesStateMachineEventTypes.CHECK,
      body: {},
    };
    const checkCompleteAvailableEvent: UpdatesStateMachineEvent = {
      type: UpdatesStateMachineEventTypes.CHECK_COMPLETE_AVAILABLE,
      body: { isRollBackToEmbedded: true },
    };
    machine.send(checkEvent);
    machine.send(checkCompleteAvailableEvent);
  });

  it('should see updatePending but no update available', (done) => {
    const testUpdateId = '00000-xxxx';
    let wasDownloading = false;
    let wasChecking = false;
    const machine = interpret(UpdatesStateMachine)
      .onTransition((state) => {
        if (state.value === 'checking') {
          wasChecking = true;
        }
        if (state.value === 'downloading') {
          wasDownloading = true;
        } else if (state.value === 'idle' && wasChecking && wasDownloading) {
          expect(state.context.isChecking).toBe(false);
          expect(state.context.checkError).toBeUndefined();
          expect(state.context.latestManifest).toBeUndefined();
          expect(state.context.downloadedManifest).toEqual({ updateId: testUpdateId });
          expect(state.context.isUpdateAvailable).toBe(false);
          expect(state.context.isUpdatePending).toBe(true);
          done();
        }
      })
      .start();
    const downloadEvent: UpdatesStateMachineEvent = {
      type: UpdatesStateMachineEventTypes.DOWNLOAD,
      body: {},
    };
    const downloadCompleteEvent: UpdatesStateMachineEvent = {
      type: UpdatesStateMachineEventTypes.DOWNLOAD_COMPLETE,
      body: { manifest: { updateId: testUpdateId } },
    };
    const checkEvent: UpdatesStateMachineEvent = {
      type: UpdatesStateMachineEventTypes.CHECK,
      body: {},
    };
    const checkCompleteEvent: UpdatesStateMachineEvent = {
      type: UpdatesStateMachineEventTypes.CHECK_COMPLETE_UNAVAILABLE,
      body: { manifest: { updateId: testUpdateId } },
    };

    machine.send(downloadEvent);
    machine.send(downloadCompleteEvent);
    machine.send(checkEvent);
    machine.send(checkCompleteEvent);
  });
});
