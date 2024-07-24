//  Copyright (c) 2023 650 Industries, Inc. All rights reserved.

// swiftlint:disable closure_body_length

import ExpoModulesTestCore

@testable import EXUpdates

import EXManifests

class TestStateChangeDelegate: UpdatesStateChangeDelegate {
  var lastEventType: EXUpdates.UpdatesStateEventType?
  var lastEventBody: [String: Any?]?
  func sendUpdateStateChangeEventToAppContext(_ eventType: EXUpdates.UpdatesStateEventType, body: [String: Any?]) {
    lastEventType = eventType
    lastEventBody = body
  }
}

class UpdatesStateMachineSpec: ExpoSpec {
  override class func spec() {
    describe("default state") {
      it("instantiates") {
        let testStateChangeDelegate = TestStateChangeDelegate()
        let machine = UpdatesStateMachine(validUpdatesStateValues: Set(UpdatesStateValue.allCases))
        machine.changeEventDelegate = testStateChangeDelegate
        expect(machine.getStateForTesting()) == .idle
      }

      it("should handle check and checkCompleteAvailable") {
        let testStateChangeDelegate = TestStateChangeDelegate()
        let machine = UpdatesStateMachine(validUpdatesStateValues: Set(UpdatesStateValue.allCases))
        machine.changeEventDelegate = testStateChangeDelegate

        machine.processEventForTesting(UpdatesStateEventCheck())
        expect(machine.getStateForTesting()) == .checking
        expect(testStateChangeDelegate.lastEventType) == .check

        machine.processEventForTesting(UpdatesStateEventCheckCompleteWithUpdate(manifest: [
          "updateId": "0000-xxxx"
        ]))
        expect(machine.getStateForTesting()) == .idle
        expect(machine.context.isChecking) == false
        expect(machine.context.checkError).to(beNil())
        expect(machine.context.latestManifest?["updateId"] as? String ?? "") == "0000-xxxx"
        expect(machine.context.isUpdateAvailable) == true
        expect(machine.context.isUpdatePending) == false
        expect(testStateChangeDelegate.lastEventType) == .checkCompleteAvailable
        let values = testStateChangeDelegate.lastEventBody?["context"] as? [String: Any] ?? [:]
        expect(values["isUpdateAvailable"] as? Bool ?? false) == true
      }

      it("should handle check and checkCompleteUnavailable") {
        let testStateChangeDelegate = TestStateChangeDelegate()
        let machine = UpdatesStateMachine(validUpdatesStateValues: Set(UpdatesStateValue.allCases))
        machine.changeEventDelegate = testStateChangeDelegate

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
        let testStateChangeDelegate = TestStateChangeDelegate()
        let machine = UpdatesStateMachine(validUpdatesStateValues: Set(UpdatesStateValue.allCases))
        machine.changeEventDelegate = testStateChangeDelegate

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
        let testStateChangeDelegate = TestStateChangeDelegate()
        let machine = UpdatesStateMachine(validUpdatesStateValues: Set(UpdatesStateValue.allCases))
        machine.changeEventDelegate = testStateChangeDelegate
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
        let testStateChangeDelegate = TestStateChangeDelegate()
        let machine = UpdatesStateMachine(validUpdatesStateValues: Set(UpdatesStateValue.allCases))
        machine.changeEventDelegate = testStateChangeDelegate

        machine.processEventForTesting(UpdatesStateEventCheck())
        expect(machine.getStateForTesting()) == .checking
        // Reset the test delegate
        testStateChangeDelegate.lastEventBody = nil
        testStateChangeDelegate.lastEventType = nil

        // In .checking state, download events should be ignored,
        // state should not change, context should not change,
        // no events should be sent to JS
        expect(machine.processEventForTesting(UpdatesStateEventDownload())).to(throwAssertion())

        expect(machine.getStateForTesting()) == .checking
        expect(testStateChangeDelegate.lastEventType).to(beNil())
        expect(testStateChangeDelegate.lastEventBody).to(beNil())

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
        let testStateChangeDelegate = TestStateChangeDelegate()
        let machine = UpdatesStateMachine(validUpdatesStateValues: [UpdatesStateValue.idle])
        machine.changeEventDelegate = testStateChangeDelegate

        expect(machine.processEventForTesting(UpdatesStateEventDownload())).to(throwAssertion())
        expect(machine.getStateForTesting()) == .idle
        expect(testStateChangeDelegate.lastEventType).to(beNil())
        expect(testStateChangeDelegate.lastEventBody).to(beNil())
      }
    }
  }
}

// swiftlint:enable closure_body_length
