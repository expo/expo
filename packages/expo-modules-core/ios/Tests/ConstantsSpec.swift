import ExpoModulesTestCore

@testable import ExpoModulesCore

class ConstantsSpec: ExpoSpec {
  override func spec() {
    let appContext = AppContext()

    it("takes closure resolving to dictionary") {
      let holder = mockModuleHolder(appContext) {
        Constants {
          return ["test": 123]
        }
      }
      expect(holder.getConstants()["test"] as? Int) == 123
    }

    it("takes the dictionary") {
      let holder = mockModuleHolder(appContext) {
        Constants(["test": 123])
      }
      expect(holder.getConstants()["test"] as? Int) == 123
    }

    it("merges multiple constants definitions") {
      let holder = mockModuleHolder(appContext) {
        Constants(["test": 456, "test2": 789])
        Constants(["test": 123])
      }
      let consts = holder.getConstants()
      expect(consts["test"] as? Int) == 123
      expect(consts["test2"] as? Int) == 789
    }
  }
}
