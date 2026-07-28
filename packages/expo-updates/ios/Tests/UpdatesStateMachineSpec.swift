//  Copyright (c) 2023 650 Industries, Inc. All rights reserved.

// NOTE: The rest of the UpdatesStateMachine tests have been migrated to Swift Testing in
// UpdatesStateMachineTests.swift. The two tests below remain on Quick/Nimble because they rely on
// Nimble's `throwAssertion()` matcher (to catch Swift `assert`/`precondition`/`fatalError`), which
// has no Swift Testing equivalent. Migrate these once such support exists.

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

        expect(machine.processEventForTesting(.downloadCompleteUnavailable)).to(throwAssertion())
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
