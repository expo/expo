//  Copyright (c) 2023 650 Industries, Inc. All rights reserved.

// swiftlint:disable closure_body_length

import ExpoModulesTestCore

@testable import EXUpdates

import EXManifests

class TestStateChangeDelegate: UpdatesStateChangeDelegate {
  var lastEventType: EXUpdates.UpdatesStateEventType?
  var lastEventBody: [String: Any?]?
  func sendUpdateStateChangeEventToBridge(_ eventType: EXUpdates.UpdatesStateEventType, body: [String: Any?]) {
    lastEventType = eventType
    lastEventBody = body
  }
}

class UpdatesStateMachineSpec: ExpoSpec {
  override func spec() {
    describe("default state") {
      it("instantiates") {
        let testStateChangeDelegate = TestStateChangeDelegate()
        let machine = UpdatesStateMachine(changeEventDelegate: testStateChangeDelegate)
        expect(machine.state) == .idle
      }

      it("should handle check and checkCompleteAvailable") {
        let testStateChangeDelegate = TestStateChangeDelegate()
        let machine = UpdatesStateMachine(changeEventDelegate: testStateChangeDelegate)

        machine.processEvent(UpdatesStateEventCheck())
        expect(machine.state) == .checking
        expect(testStateChangeDelegate.lastEventType) == .check

        machine.processEvent(UpdatesStateEventCheckCompleteWithUpdate(manifest: [
          "updateId": "0000-xxxx"
        ]))
        expect(machine.state) == .idle
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
        let machine = UpdatesStateMachine(changeEventDelegate: testStateChangeDelegate)

        machine.processEvent(UpdatesStateEventCheck())
        expect(machine.state) == .checking

        machine.processEvent(UpdatesStateEventCheckComplete())
        expect(machine.state) == .idle
        expect(machine.context.isChecking) == false
        expect(machine.context.checkError).to(beNil())
        expect(machine.context.latestManifest).to(beNil())
        expect(machine.context.isUpdateAvailable) == false
        expect(machine.context.isUpdatePending) == false
      }

      it("should handle download and downloadComplete") {
        let testStateChangeDelegate = TestStateChangeDelegate()
        let machine = UpdatesStateMachine(changeEventDelegate: testStateChangeDelegate)

        machine.processEvent(UpdatesStateEventDownload())
        expect(machine.state) == .downloading

        machine.processEvent(UpdatesStateEventDownloadCompleteWithUpdate(manifest: [
          "updateId": "0000-xxxx"
        ]))
        expect(machine.state) == .idle
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
        let machine = UpdatesStateMachine(changeEventDelegate: testStateChangeDelegate)

        machine.processEvent(UpdatesStateEventCheck())
        expect(machine.state) == .checking

        machine.processEvent(UpdatesStateEventCheckCompleteWithRollback())
        expect(machine.state) == .idle
        expect(machine.context.isChecking) == false
        expect(machine.context.checkError).to(beNil())
        expect(machine.context.latestManifest).to(beNil())
        expect(machine.context.isUpdateAvailable) == true
        expect(machine.context.isUpdatePending) == false
        expect(machine.context.isRollback) == true
      }

      it("invalid transitions are handled as expected") {
        let testStateChangeDelegate = TestStateChangeDelegate()
        let machine = UpdatesStateMachine(changeEventDelegate: testStateChangeDelegate)

        machine.processEvent(UpdatesStateEventCheck())
        expect(machine.state) == .checking
        // Reset the test delegate
        testStateChangeDelegate.lastEventBody = nil
        testStateChangeDelegate.lastEventType = nil

        // In .checking state, download events should be ignored,
        // state should not change, context should not change,
        // no events should be sent to JS
        machine.processEvent(UpdatesStateEventDownload())

        expect(machine.state) == .checking
        expect(testStateChangeDelegate.lastEventType).to(beNil())
        expect(testStateChangeDelegate.lastEventBody).to(beNil())

        machine.processEvent(UpdatesStateEventDownloadCompleteWithUpdate(manifest: [
          "updateId": "0000-xxxx"
        ]))

        expect(machine.state) == .checking
        expect(machine.context.downloadedManifest).to(beNil())

        machine.reset() // go back to .idle

        machine.processEvent(UpdatesStateEventRestart())
        expect(machine.state) == .restarting

        // If restarting, all events should be ignored
        machine.processEvent(UpdatesStateEventCheck())
        expect(machine.state) == .restarting

        machine.processEvent(UpdatesStateEventDownload())
        expect(machine.state) == .restarting

        machine.processEvent(UpdatesStateEventDownloadComplete())
        expect(machine.state) == .restarting
      }
    }
  }
}

// swiftlint:enable closure_body_length
