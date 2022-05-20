import ExpoModulesTestCore

@testable import ExpoClipboard

class ClipboardModuleSpec: ExpoSpec {
  override func spec() {
    let appContext = AppContext()
    let holder = ModuleHolder(appContext: appContext, module: ClipboardModule(appContext: appContext))
    
    func testModuleFunction<T>(_ functionName: String, args: [Any], _ block: @escaping (T) -> ()) {
      waitUntil { done in
        holder.call(function: functionName, args: []) { result in
          let value = try! result.get()

//          expect(value).notTo(beNil())
          expect(value).to(beAKindOf(T.self))
          block(value as! T)
          done()
        }
      }
    }
    
    // MARK: - Strings
    
//    describe("getStringAsync") {
//      it("returns plain text from the clipboard") {
//        let expectedString = "hello"
//        UIPasteboard.general.string = expectedString
//
//        let options = GetStringOptions(preferredFormat: .plainText)
//        testModuleFunction("getStringAsync", args: [options]) { (result: String) in
//          expect(result) == expectedString
//        }
//      }
//
//      it("returns empty string if no text in clipboard") {
//        UIPasteboard.general.items = []
//
//        let options = GetStringOptions(preferredFormat: .plainText)
//        testModuleFunction("getStringAsync", args: [options]) { (result: String) in
//          expect(result) == ""
//        }
//      }
//    }
    
    describe("hasStringAsync") {
      it("returns true when clipboard contains a string") {
        UIPasteboard.general.string = "hello world"
        
        testModuleFunction("hasStringAsync", args: []) { (result: Bool) in
          expect(result) == true
        }
      }
      
      it("returns false when there are no no items") {
        UIPasteboard.general.items = []
        
        testModuleFunction("hasStringAsync", args: []) { (result: Bool) in
          expect(result) == false
        }
      }
      
      it("returns false when items are not strings") {
        UIPasteboard.general.image = UIImage()
        
        testModuleFunction("hasStringAsync", args: []) { (result: Bool) in
          expect(result) == false
        }
      }
    }
    
    
    
    // MARK: - Images
    
    describe("hasImageAsync") {
      it("returns true when there is image") {
        UIPasteboard.general.image = UIImage()
        
        testModuleFunction("hasImageAsync", args: []) { (result: Bool) in
          expect(result) == true
        }
      }
      
      it("returns false when there are no no items") {
        UIPasteboard.general.items = []
        
        testModuleFunction("hasImageAsync", args: []) { (result: Bool) in
          expect(result) == false
        }
      }
      
      it("returns false when items are not images") {
        UIPasteboard.general.items = []
        UIPasteboard.general.string = "not an image"
        
        testModuleFunction("hasImageAsync", args: []) { (result: Bool) in
          expect(result) == false
        }
      }
    }
  }
}
