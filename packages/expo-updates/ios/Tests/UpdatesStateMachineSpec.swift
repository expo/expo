//  Copyright (c) 2023 650 Industries, Inc. All rights reserved.

// swiftlint:disable function_body_length
// swiftlint:disable closure_body_length

import ExpoModulesTestCore

@testable import EXUpdates

import EXManifests

class TestStateChangeEventSender: UpdatesStateChangeEventSender {
  var lastEventType: EXUpdates.UpdatesStateEventType?
  var lastEventBody: [String: Any]?
  func sendUpdateStateChangeEventToBridge(_ eventType: EXUpdates.UpdatesStateEventType, body: [String: Any]) {
    lastEventType = eventType
    lastEventBody = body
  }
}

class UpdatesStateMachineSpec: ExpoSpec {
  override func spec() {
    describe("default state") {
      it("instantiates") {
        let machine = UpdatesStateMachine()
        expect(machine.state) == .idle
      }

      it("should handle check and checkCompleteAvailable") {
        let machine = UpdatesStateMachine()
        let testStateChangeEventSender: TestStateChangeEventSender = TestStateChangeEventSender()

        machine.changeEventSender = testStateChangeEventSender

        machine.processEvent(UpdatesStateEvent(type: .check))
        expect(machine.state) == .checking
        expect(testStateChangeEventSender.lastEventType) == .check

        machine.processEvent(UpdatesStateEvent(type: .checkCompleteAvailable, body: [
          "manifest": [
            "updateId": "0000-xxxx"
          ]
        ]))
        expect(machine.state) == .idle
        expect(machine.context.isChecking) == false
        expect(machine.context.checkError).to(beNil())
        expect(machine.context.latestManifest?["updateId"] as? String ?? "") == "0000-xxxx"
        expect(machine.context.isUpdateAvailable) == true
        expect(machine.context.isUpdatePending) == false
        expect(testStateChangeEventSender.lastEventType) == .checkCompleteAvailable
        expect(testStateChangeEventSender.lastEventBody?["isUpdateAvailable"] as? Bool ?? false) == true
      }

      it("should handle check and checkCompleteUnavailable") {
        let machine = UpdatesStateMachine()

        machine.processEvent(UpdatesStateEvent(type: .check))
        expect(machine.state) == .checking

        machine.processEvent(UpdatesStateEvent(type: .checkCompleteUnavailable))
        expect(machine.state) == .idle
        expect(machine.context.isChecking) == false
        expect(machine.context.checkError).to(beNil())
        expect(machine.context.latestManifest).to(beNil())
        expect(machine.context.isUpdateAvailable) == false
        expect(machine.context.isUpdatePending) == false
      }

      it("should handle download and downloadComplete") {
        let machine = UpdatesStateMachine()

        machine.processEvent(UpdatesStateEvent(type: .download))
        expect(machine.state) == .downloading

        machine.processEvent(UpdatesStateEvent(type: .downloadComplete, body: [
          "manifest": [
            "updateId": "0000-xxxx"
          ]
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
        let machine = UpdatesStateMachine()

        machine.processEvent(UpdatesStateEvent(type: .check))
        expect(machine.state) == .checking

        machine.processEvent(UpdatesStateEvent(type: .checkCompleteAvailable, body: [
          "isRollBackToEmbedded": true
        ]))
        expect(machine.state) == .idle
        expect(machine.context.isChecking) == false
        expect(machine.context.checkError).to(beNil())
        expect(machine.context.latestManifest).to(beNil())
        expect(machine.context.isUpdateAvailable) == true
        expect(machine.context.isUpdatePending) == false
        expect(machine.context.isRollback) == true
      }

      it("invalid transitions are handled as expected") {
        let machine = UpdatesStateMachine()

        machine.processEvent(UpdatesStateEvent(type: .check))
        expect(machine.state) == .checking

        let testStateChangeEventSender: TestStateChangeEventSender = TestStateChangeEventSender()
        machine.changeEventSender = testStateChangeEventSender

        // In .checking state, download events should be ignored,
        // state should not change, context should not change,
        // no events should be sent to JS
        machine.processEvent(UpdatesStateEvent(type: .download))

        expect(machine.state) == .checking
        expect(testStateChangeEventSender.lastEventType).to(beNil())
        expect(testStateChangeEventSender.lastEventBody).to(beNil())

        machine.processEvent(UpdatesStateEvent(type: .downloadComplete, body: [
          "manifest": [
            "updateId": "0000-xxxx"
          ]
        ]))

        expect(machine.state) == .checking
        expect(machine.context.downloadedManifest).to(beNil())

        machine.reset() // go back to .idle

        machine.processEvent(UpdatesStateEvent(type: .restart))
        expect(machine.state) == .restarting

        // If restarting, all events should be ignored
        machine.processEvent(UpdatesStateEvent(type: .check))
        expect(machine.state) == .restarting

        machine.processEvent(UpdatesStateEvent(type: .download))
        expect(machine.state) == .restarting

        machine.processEvent(UpdatesStateEvent(type: .downloadComplete))
        expect(machine.state) == .restarting
      }
    }
  }
}
