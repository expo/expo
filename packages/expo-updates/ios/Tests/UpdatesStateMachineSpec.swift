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
        let machine = UpdatesStateMachine(eventManager: testStateChangeEventManager, validUpdatesStateValues: Set(UpdatesStateValue.allCases))
        expect(machine.getStateForTesting()) == .idle
      }

      it("should handle check and checkCompleteAvailable") {
        let testStateChangeEventManager = TestStateChangeEventManager()
        let machine = UpdatesStateMachine(eventManager: testStateChangeEventManager, validUpdatesStateValues: Set(UpdatesStateValue.allCases))

        machine.processEventForTesting(UpdatesStateEventCheck())
        expect(machine.getStateForTesting()) == .checking
        expect(testStateChangeEventManager.lastContext?.isChecking) == true

        machine.processEventForTesting(UpdatesStateEventCheckCompleteWithUpdate(manifest: [
          "updateId": "0000-xxxx"
        ]))
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
        let machine = UpdatesStateMachine(eventManager: testStateChangeEventManager, validUpdatesStateValues: Set(UpdatesStateValue.allCases))

        machine.processEventForTesting(UpdatesStateEventCheck())
        expect(machine.getStateForTesting()) == .checking

        machine.processEventForTesting(UpdatesStateEventCheckComplete())
        expect(machine.getStateForTesting()) == .idle
        expect(machine.context.isChecking) == false
        expect(machine.context.checkError).to(beNil())
        expect(machine.context.latestManifest).to(beNil())
        expect(machine.context.isUpdateAvailable) == false
        expect(machine.context.isUpdatePending) == false
      }

      it("should handle download and downloadComplete") {
        let testStateChangeEventManager = TestStateChangeEventManager()
        let machine = UpdatesStateMachine(eventManager: testStateChangeEventManager, validUpdatesStateValues: Set(UpdatesStateValue.allCases))

        machine.processEventForTesting(UpdatesStateEventDownload())
        expect(machine.getStateForTesting()) == .downloading

        machine.processEventForTesting(UpdatesStateEventDownloadCompleteWithUpdate(manifest: [
          "updateId": "0000-xxxx"
        ]))
        expect(machine.getStateForTesting()) == .idle
        expect(machine.context.isChecking) == false
        expect(machine.context.downloadError).to(beNil())
        expect(machine.context.latestManifest?["updateId"] as? String ?? "") == "0000-xxxx"
        expect(machine.context.downloadedManifest?["updateId"] as? String ?? "") == "0000-xxxx"
        expect(machine.context.isUpdateAvailable) == true
        expect(machine.context.isUpdatePending) == true
        expect(machine.context.isRollback) == false
      }

      it("should handle rollback") {
        let testStateChangeEventManager = TestStateChangeEventManager()
        let machine = UpdatesStateMachine(eventManager: testStateChangeEventManager, validUpdatesStateValues: Set(UpdatesStateValue.allCases))
        let commitTime = Date()
        machine.processEventForTesting(UpdatesStateEventCheck())
        expect(machine.getStateForTesting()) == .checking

        machine.processEventForTesting(UpdatesStateEventCheckCompleteWithRollback(rollbackCommitTime: commitTime))
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
        let machine = UpdatesStateMachine(eventManager: testStateChangeEventManager, validUpdatesStateValues: Set(UpdatesStateValue.allCases))

        machine.processEventForTesting(UpdatesStateEventCheck())
        expect(machine.getStateForTesting()) == .checking
        // Reset the test delegate
        testStateChangeEventManager.lastContext = nil

        // In .checking state, download events should be ignored,
        // state should not change, context should not change,
        // no events should be sent to JS
        expect(machine.processEventForTesting(UpdatesStateEventDownload())).to(throwAssertion())

        expect(machine.getStateForTesting()) == .checking
        expect(testStateChangeEventManager.lastContext).to(beNil())

        expect(
          machine.processEventForTesting(UpdatesStateEventDownloadCompleteWithUpdate(manifest: [
            "updateId": "0000-xxxx"
          ]))
        ).to(throwAssertion())

        expect(machine.getStateForTesting()) == .checking
        expect(machine.context.downloadedManifest).to(beNil())

        machine.resetForTesting() // go back to .idle

        machine.processEventForTesting(UpdatesStateEventRestart())
        expect(machine.getStateForTesting()) == .restarting

        // If restarting, all events should be ignored
        expect(machine.processEventForTesting(UpdatesStateEventCheck())).to(throwAssertion())
        expect(machine.getStateForTesting()) == .restarting

        expect(machine.processEventForTesting(UpdatesStateEventDownload())).to(throwAssertion())
        expect(machine.getStateForTesting()) == .restarting

        expect(machine.processEventForTesting(UpdatesStateEventDownloadComplete())).to(throwAssertion())
        expect(machine.getStateForTesting()) == .restarting
      }

      it("invalid state values are handled as expected") {
        let testStateChangeEventManager = TestStateChangeEventManager()
        let machine = UpdatesStateMachine(eventManager: testStateChangeEventManager, validUpdatesStateValues: [UpdatesStateValue.idle])

        expect(machine.processEventForTesting(UpdatesStateEventDownload())).to(throwAssertion())
        expect(machine.getStateForTesting()) == .idle
        expect(testStateChangeEventManager.lastContext).to(beNil())
      }
    }
  }
}

// swiftlint:enable closure_body_length
