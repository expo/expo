import Quick
import Nimble

@testable import EXDevMenu

class DevMenuExpoSessionDelegateTest: QuickSpec {
  override func spec() {
    it("delegate should save and restore the same value") {
      let delegate = DevMenuExpoSessionDelegate(manager: DevMenuManager.shared)
      let session = ["expo": "is awesome", "key": "value", "sessionSecret": "secret"]

      try delegate.setSessionAsync(session)
      let restoredSession = delegate.restoreSession()

      expect(restoredSession as? [String: String]).to(equal(session))
    }

    it("delegate should throw if `sessionSecret` wasn't passed") {
      let delegate = DevMenuExpoSessionDelegate(manager: DevMenuManager.shared)
      let session = ["expo": "is awesome", "key": "value"]

      expect { try delegate.setSessionAsync(session) }.to(throwError())
    }
  }
}
