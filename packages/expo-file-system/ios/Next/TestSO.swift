import Foundation
import ExpoModulesCore

public class TestSO: SharedObject {
    var testParts: [String]
    
    init(testParts: [TestSO] = []) {
      if testParts.isEmpty {
        self.testParts = ["Hello"]
      } else {
        self.testParts = testParts.flatMap({ $0.testParts })
      }
    }

    var size: Int {
        return testParts.reduce(0) { $0 + $1.count }
    }
}

