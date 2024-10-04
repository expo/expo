import Quick
import Nimble

@testable import ABI44_0_0ExpoModulesCore

class ConstantsSpec: QuickSpec {
  override func spec() {
    let appContext = AppContext()

    it("takes closure resolving to dictionary") {
      let holder = mockModuleHolder(appContext) {
        $0.constants {
          return ["test": 123]
        }
      }
      expect(holder.getConstants()["test"] as? Int) == 123
    }

    it("takes the dictionary") {
      let holder = mockModuleHolder(appContext) {
        $0.constants(["test": 123])
      }
      expect(holder.getConstants()["test"] as? Int) == 123
    }

    it("merges multiple constants definitions") {
      let holder = mockModuleHolder(appContext) {
        $0.constants(["test": 456, "test2": 789])
        $0.constants(["test": 123])
      }
      let consts = holder.getConstants()
      expect(consts["test"] as? Int) == 123
      expect(consts["test2"] as? Int) == 789
    }
  }
}
