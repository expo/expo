//  Copyright (c) 2023 650 Industries, Inc. All rights reserved.

// swiftlint:disable closure_body_length

import ExpoModulesTestCore

@testable import EXUpdates

import EXManifests

class TestStateChangeEventManager: UpdatesEventManager {
  var lastContext: UpdatesStateContext? = nil
  weak var observer: (any EXUpdates.UpdatesEventManagerObserver)?

  func sendStateMachineContextEvent(context: EXUpdates.UpdatesStateContext) {
    lastContext = context
  }
}

class UpdatesStateMachineSpec: ExpoSpec {
  override class func spec() {
    describe("default state") {
      it("instantiates") {
        let testStateChangeEventManager = TestStateChangeEventManager()
        let machine = UpdatesStateMachine(logger: UpdatesLogger(), eventManager: testStateChangeEventManager, validUpdatesStateValues: Set(UpdatesStateValue.allCases))
        expect(machine.getStateForTesting()) == .idle
      }

      it("sequence numbers") {
        let testStateChangeEventManager = TestStateChangeEventManager()
        let machine = UpdatesStateMachine(logger: UpdatesLogger(), eventManager: testStateChangeEventManager, validUpdatesStateValues: Set(UpdatesStateValue.allCases))
        expect(machine.getStateForTesting()) == .idle

        expect(machine.context.sequenceNumber) == 0

        machine.processEventForTesting(.startStartup)
        machine.processEventForTesting(.check)
        machine.processEventForTesting(.checkCompleteUnavailable)
        machine.processEventForTesting(.endStartup)

        expect(machine.context.sequenceNumber) == 4
      }

      it("restart") {
        let testStateChangeEventManager = TestStateChangeEventManager()
        let machine = UpdatesStateMachine(logger: UpdatesLogger(), eventManager: testStateChangeEventManager, validUpdatesStateValues: Set(UpdatesStateValue.allCases))
        expect(machine.getStateForTesting()) == .idle

        expect(machine.context.isRestarting) == false
        machine.processEventForTesting(.restart)
        expect(machine.context.isRestarting) == true
        expect(machine.context.sequenceNumber) == 1

        machine.resetAndIncrementRestartCountForTesting()
        expect(machine.context.restartCount) == 1
        expect(machine.context.isRestarting) == false
        expect(machine.context.sequenceNumber) == 2
      }

      it("should handle startStartup and endStartup") {
        let testStateChangeEventManager = TestStateChangeEventManager()
        let machine = UpdatesStateMachine(logger: UpdatesLogger(), eventManager: testStateChangeEventManager, validUpdatesStateValues: Set(UpdatesStateValue.allCases))

        machine.processEventForTesting(.startStartup)
        expect(machine.getStateForTesting()) == .idle
        expect(testStateChangeEventManager.lastContext?.isStartupProcedureRunning) == true

        machine.processEventForTesting(.endStartup)
        expect(machine.getStateForTesting()) == .idle
        expect(testStateChangeEventManager.lastContext?.isStartupProcedureRunning) == false
      }

      it("should handle check and checkCompleteAvailable") {
        let testStateChangeEventManager = TestStateChangeEventManager()
        let machine = UpdatesStateMachine(logger: UpdatesLogger(), eventManager: testStateChangeEventManager, validUpdatesStateValues: Set(UpdatesStateValue.allCases))

        machine.processEventForTesting(.check)
        expect(machine.getStateForTesting()) == .checking
        expect(testStateChangeEventManager.lastContext?.isChecking) == true

        machine.processEventForTesting(.checkCompleteWithUpdate(manifest: ["updateId": "0000-xxxx"]))
        expect(machine.getStateForTesting()) == .idle
        expect(machine.context.isChecking) == false
        expect(machine.context.checkError).to(beNil())
        expect(machine.context.latestManifest?["updateId"] as? String ?? "") == "0000-xxxx"
        expect(machine.context.isUpdateAvailable) == true
        expect(machine.context.isUpdatePending) == false
        expect(testStateChangeEventManager.lastContext?.isUpdateAvailable) == true
        let values = testStateChangeEventManager.lastContext
        expect(values?.isUpdateAvailable) == true
      }

      it("should handle check and checkCompleteUnavailable") {
        let testStateChangeEventManager = TestStateChangeEventManager()
        let machine = UpdatesStateMachine(logger: UpdatesLogger(), eventManager: testStateChangeEventManager, validUpdatesStateValues: Set(UpdatesStateValue.allCases))

        machine.processEventForTesting(.check)
        expect(machine.getStateForTesting()) == .checking

        machine.processEventForTesting(.checkCompleteUnavailable)
        expect(machine.getStateForTesting()) == .idle
        expect(machine.context.isChecking) == false
        expect(machine.context.checkError).to(beNil())
        expect(machine.context.latestManifest).to(beNil())
        expect(machine.context.isUpdateAvailable) == false
        expect(machine.context.isUpdatePending) == false
      }

      it("should handle download and downloadComplete") {
        let testStateChangeEventManager = TestStateChangeEventManager()
        let machine = UpdatesStateMachine(logger: UpdatesLogger(), eventManager: testStateChangeEventManager, validUpdatesStateValues: Set(UpdatesStateValue.allCases))

        machine.processEventForTesting(.download)
        expect(machine.getStateForTesting()) == .downloading

        machine.processEventForTesting(.downloadCompleteWithUpdate(manifest: ["updateId": "0000-xxxx"]))
        expect(machine.getStateForTesting()) == .idle
        expect(machine.context.isChecking) == false
        expect(machine.context.downloadError).to(beNil())
        expect(machine.context.latestManifest?["updateId"] as? String ?? "") == "0000-xxxx"
        expect(machine.context.downloadedManifest?["updateId"] as? String ?? "") == "0000-xxxx"
        expect(machine.context.isUpdateAvailable) == true
        expect(machine.context.isUpdatePending) == true
        expect(machine.context.rollback) == nil
      }

      it("should handle download progress") {
        let testStateChangeEventManager = TestStateChangeEventManager()
        let machine = UpdatesStateMachine(logger: UpdatesLogger(), eventManager: testStateChangeEventManager, validUpdatesStateValues: Set(UpdatesStateValue.allCases))

        machine.processEventForTesting(.download)
        expect(machine.getStateForTesting()) == .downloading
        expect(testStateChangeEventManager.lastContext?.downloadProgress) == 0

        machine.processEventForTesting(.downloadProgress(progress: 0.5))
        expect(machine.getStateForTesting()) == .downloading
        expect(testStateChangeEventManager.lastContext?.downloadProgress) == 0.5

        machine.processEventForTesting(.downloadComplete)
        expect(machine.getStateForTesting()) == .idle
        expect(testStateChangeEventManager.lastContext?.downloadProgress) == 1
      }

      it("should handle rollback") {
        let testStateChangeEventManager = TestStateChangeEventManager()
        let machine = UpdatesStateMachine(logger: UpdatesLogger(), eventManager: testStateChangeEventManager, validUpdatesStateValues: Set(UpdatesStateValue.allCases))
        let commitTime = Date()
        machine.processEventForTesting(.check)
        expect(machine.getStateForTesting()) == .checking

        machine.processEventForTesting(.checkCompleteWithRollback(rollbackCommitTime: commitTime))
        expect(machine.getStateForTesting()) == .idle
        expect(machine.context.isChecking) == false
        expect(machine.context.checkError).to(beNil())
        expect(machine.context.latestManifest).to(beNil())
        expect(machine.context.isUpdateAvailable) == true
        expect(machine.context.isUpdatePending) == false
        expect(machine.context.rollback?.commitTime) == commitTime
      }

      it("invalid transitions are handled as expected") {
        let testStateChangeEventManager = TestStateChangeEventManager()
        let machine = UpdatesStateMachine(logger: UpdatesLogger(), eventManager: testStateChangeEventManager, validUpdatesStateValues: Set(UpdatesStateValue.allCases))

        machine.processEventForTesting(.check)
        expect(machine.getStateForTesting()) == .checking
        // Reset the test delegate
        testStateChangeEventManager.lastContext = nil

        // In .checking state, download events should be ignored,
        // state should not change, context should not change,
        // no events should be sent to JS
        expect(machine.processEventForTesting(.download)).to(throwAssertion())

        expect(machine.getStateForTesting()) == .checking
        expect(testStateChangeEventManager.lastContext).to(beNil())

        expect(
          machine.processEventForTesting(.downloadCompleteWithUpdate(manifest: ["updateId": "0000-xxxx"]))
        ).to(throwAssertion())

        expect(machine.getStateForTesting()) == .checking
        expect(machine.context.downloadedManifest).to(beNil())

        machine.resetAndIncrementRestartCountForTesting() // go back to .idle

        machine.processEventForTesting(.restart)
        expect(machine.getStateForTesting()) == .restarting

        // If restarting, all events should be ignored
        expect(machine.processEventForTesting(.check)).to(throwAssertion())
        expect(machine.getStateForTesting()) == .restarting

        expect(machine.processEventForTesting(.download)).to(throwAssertion())
        expect(machine.getStateForTesting()) == .restarting

        expect(machine.processEventForTesting(.downloadComplete)).to(throwAssertion())
        expect(machine.getStateForTesting()) == .restarting
      }

      it("invalid state values are handled as expected") {
        let testStateChangeEventManager = TestStateChangeEventManager()
        let machine = UpdatesStateMachine(logger: UpdatesLogger(), eventManager: testStateChangeEventManager, validUpdatesStateValues: [UpdatesStateValue.idle])

        expect(machine.processEventForTesting(.download)).to(throwAssertion())
        expect(machine.getStateForTesting()) == .idle
        expect(testStateChangeEventManager.lastContext).to(beNil())
      }
    }
  }
}

// swiftlint:enable closure_body_length
