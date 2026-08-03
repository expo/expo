//  Copyright (c) 2023 650 Industries, Inc. All rights reserved.

import Testing

@testable import EXUpdates

import EXManifests

@Suite("UpdatesStateMachine")
struct UpdatesStateMachineTests {
  @Test
  func `instantiates`() {
    let testStateChangeEventManager = TestStateChangeEventManager()
    let machine = UpdatesStateMachine(logger: UpdatesLogger(), eventManager: testStateChangeEventManager, validUpdatesStateValues: Set(UpdatesStateValue.allCases))
    #expect(machine.getStateForTesting() == .idle)
  }

  @Test
  func `sequence numbers`() {
    let testStateChangeEventManager = TestStateChangeEventManager()
    let machine = UpdatesStateMachine(logger: UpdatesLogger(), eventManager: testStateChangeEventManager, validUpdatesStateValues: Set(UpdatesStateValue.allCases))
    #expect(machine.getStateForTesting() == .idle)

    #expect(machine.context.sequenceNumber == 0)

    machine.processEventForTesting(.startStartup)
    machine.processEventForTesting(.check)
    machine.processEventForTesting(.checkCompleteUnavailable)
    machine.processEventForTesting(.endStartup)

    #expect(machine.context.sequenceNumber == 4)
  }

  @Test
  func `restart`() {
    let testStateChangeEventManager = TestStateChangeEventManager()
    let machine = UpdatesStateMachine(logger: UpdatesLogger(), eventManager: testStateChangeEventManager, validUpdatesStateValues: Set(UpdatesStateValue.allCases))
    #expect(machine.getStateForTesting() == .idle)

    #expect(machine.context.isRestarting == false)
    machine.processEventForTesting(.restart)
    #expect(machine.context.isRestarting == true)
    #expect(machine.context.sequenceNumber == 1)

    machine.resetAndIncrementRestartCountForTesting()
    #expect(machine.context.restartCount == 1)
    #expect(machine.context.isRestarting == false)
    #expect(machine.context.sequenceNumber == 2)
  }

  @Test
  func `should handle startStartup and endStartup`() {
    let testStateChangeEventManager = TestStateChangeEventManager()
    let machine = UpdatesStateMachine(logger: UpdatesLogger(), eventManager: testStateChangeEventManager, validUpdatesStateValues: Set(UpdatesStateValue.allCases))

    machine.processEventForTesting(.startStartup)
    #expect(machine.getStateForTesting() == .idle)
    #expect(testStateChangeEventManager.lastContext?.isStartupProcedureRunning == true)

    machine.processEventForTesting(.endStartup)
    #expect(machine.getStateForTesting() == .idle)
    #expect(testStateChangeEventManager.lastContext?.isStartupProcedureRunning == false)
  }

  @Test
  func `should handle check and checkCompleteAvailable`() {
    let testStateChangeEventManager = TestStateChangeEventManager()
    let machine = UpdatesStateMachine(logger: UpdatesLogger(), eventManager: testStateChangeEventManager, validUpdatesStateValues: Set(UpdatesStateValue.allCases))

    machine.processEventForTesting(.check)
    #expect(machine.getStateForTesting() == .checking)
    #expect(testStateChangeEventManager.lastContext?.isChecking == true)

    machine.processEventForTesting(.checkCompleteWithUpdate(manifest: ["updateId": "0000-xxxx"]))
    #expect(machine.getStateForTesting() == .idle)
    #expect(machine.context.isChecking == false)
    #expect(machine.context.checkError == nil)
    #expect((machine.context.latestManifest?["updateId"] as? String ?? "") == "0000-xxxx")
    #expect(machine.context.isUpdateAvailable == true)
    #expect(machine.context.isUpdatePending == false)
    #expect(testStateChangeEventManager.lastContext?.isUpdateAvailable == true)
    let values = testStateChangeEventManager.lastContext
    #expect(values?.isUpdateAvailable == true)
  }

  @Test
  func `should handle check and checkCompleteUnavailable`() {
    let testStateChangeEventManager = TestStateChangeEventManager()
    let machine = UpdatesStateMachine(logger: UpdatesLogger(), eventManager: testStateChangeEventManager, validUpdatesStateValues: Set(UpdatesStateValue.allCases))

    machine.processEventForTesting(.check)
    #expect(machine.getStateForTesting() == .checking)

    machine.processEventForTesting(.checkCompleteUnavailable)
    #expect(machine.getStateForTesting() == .idle)
    #expect(machine.context.isChecking == false)
    #expect(machine.context.checkError == nil)
    #expect(machine.context.latestManifest == nil)
    #expect(machine.context.isUpdateAvailable == false)
    #expect(machine.context.isUpdatePending == false)
  }

  @Test
  func `should handle a completed download with an update`() {
    let testStateChangeEventManager = TestStateChangeEventManager()
    let machine = UpdatesStateMachine(logger: UpdatesLogger(), eventManager: testStateChangeEventManager, validUpdatesStateValues: Set(UpdatesStateValue.allCases))

    machine.processEventForTesting(.download)
    #expect(machine.getStateForTesting() == .downloading)

    machine.processEventForTesting(.downloadCompleteWithUpdate(manifest: ["updateId": "0000-xxxx"]))
    #expect(machine.getStateForTesting() == .idle)
    #expect(machine.context.isChecking == false)
    #expect(machine.context.downloadError == nil)
    #expect((machine.context.latestManifest?["updateId"] as? String ?? "") == "0000-xxxx")
    #expect((machine.context.downloadedManifest?["updateId"] as? String ?? "") == "0000-xxxx")
    #expect(machine.context.isUpdateAvailable == true)
    #expect(machine.context.isUpdatePending == true)
    #expect(machine.context.rollback == nil)
  }

  @Test
  func `should handle a completed download with a rollback`() {
    let testStateChangeEventManager = TestStateChangeEventManager()
    let machine = UpdatesStateMachine(logger: UpdatesLogger(), eventManager: testStateChangeEventManager, validUpdatesStateValues: Set(UpdatesStateValue.allCases))

    machine.processEventForTesting(.download)
    #expect(machine.getStateForTesting() == .downloading)

    machine.processEventForTesting(.downloadCompleteWithRollback)
    #expect(machine.getStateForTesting() == .idle)
    #expect(machine.context.isDownloading == false)
    #expect(machine.context.downloadError == nil)
    #expect(machine.context.isUpdatePending == true)
  }

  @Test
  func `should handle download progress`() {
    let testStateChangeEventManager = TestStateChangeEventManager()
    let machine = UpdatesStateMachine(logger: UpdatesLogger(), eventManager: testStateChangeEventManager, validUpdatesStateValues: Set(UpdatesStateValue.allCases))

    machine.processEventForTesting(.download)
    #expect(machine.getStateForTesting() == .downloading)
    #expect(testStateChangeEventManager.lastContext?.downloadProgress == 0)

    machine.processEventForTesting(.downloadProgress(progress: 0.5))
    #expect(machine.getStateForTesting() == .downloading)
    #expect(testStateChangeEventManager.lastContext?.downloadProgress == 0.5)

    machine.processEventForTesting(.downloadCompleteUnavailable)
    #expect(machine.getStateForTesting() == .idle)
    #expect(testStateChangeEventManager.lastContext?.downloadProgress == 1)
  }

  @Test
  func `should handle rollback`() {
    let testStateChangeEventManager = TestStateChangeEventManager()
    let machine = UpdatesStateMachine(logger: UpdatesLogger(), eventManager: testStateChangeEventManager, validUpdatesStateValues: Set(UpdatesStateValue.allCases))
    let commitTime = Date()
    machine.processEventForTesting(.check)
    #expect(machine.getStateForTesting() == .checking)

    machine.processEventForTesting(.checkCompleteWithRollback(rollbackCommitTime: commitTime))
    #expect(machine.getStateForTesting() == .idle)
    #expect(machine.context.isChecking == false)
    #expect(machine.context.checkError == nil)
    #expect(machine.context.latestManifest == nil)
    #expect(machine.context.isUpdateAvailable == true)
    #expect(machine.context.isUpdatePending == false)
    #expect(machine.context.rollback?.commitTime == commitTime)
  }
}
