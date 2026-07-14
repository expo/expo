import ExpoModulesCore
import WebKit

public class TestModule: Module {
  public func definition() -> ModuleDefinition {
    Events(
      "event1",
      "event2",
      "event3",
      globalEventName,
      privateGlobalEventName,
      EventNames.staticLetEvent,
      EventNames.staticVarEvent,
      EventStructNamespace.structEvent,
      EventClassNamespace.classEvent,
      OuterNamespace.InnerNamespace.nestedEvent,
      // TODO(@HubertBer) Maybe fix this if this is needed, for now just document we don't support it
      globalAssignedToGlobal
    )

    Constant("StringConstant") { () -> Int in
      return "Swift constant 1283"
    }

    Constant("IntConstant") { () -> Int in
      return 37;
    }

    Constant("UntypedConstant") { () in 98} // Comment 1

    Function("SimpleFunction") { (a: Double, b: Int) -> Double in
      return a + b // Comment 2
    }

    Function("TestUntypedFunction") { () in
      return "string"
    }

    Function("TestUnicodeCharacters") { () in
      let 🎉 = "Cheers"

      return "\🎉! 🎉"
    }

    Function("TestUntypedFunction2") { /* Comment 3 */ () in
      // Comment 4
      return TestEnum.simpleCase
    }

    Function("TestUntypedFunction3" /* Comment 5 */) {
      return TestRecord2(field1: /* Comment 6 */ 10, "field2")
    }

    Function("TestArrays") { (a: [Int]) -> /* Comment 7 */ [[String]] in 
      return ["test"]
    }

    Function("TestDictionaries") { (a: [Int: String] /* Comment 8 */, b: [Int : [Float : String]]) -> Any in 
      return "test"
    }

    Function("TestParametrizedTypes") { (a: SomeParametrizedType<Either<Int, String>, Map<Set<Int>, Either<Set<Int>, Set<String>>>>) -> String in
      return ""
    }

    Function("TestTypeCombinations") { (a: [[[Int]]]) -> [[Either<String, [Int: String]>]] in 
      return [["test"]]
    }

    Function("TestFunctionReturningRecord") { () -> TestRecord in /* Comment 10
      multiple
      lines
      comment
      body
     */
      return ""
    }

    Function("TestFunctionReturningEnum") { () -> TestEnum in
      return TestEnum.simpleCase
    }

    AsyncFunction("TestSimpleAsyncFunction") { (a: String, b: String) async ->  String in
      return a + b
    }

    AsyncFunction("TestUnderscore") { (url: URL, _  /* Comment 10 */: [BarcodeType]) in
    }


    Class(TestClassWithConstructor.self) { 
      Constructor { (a: Int) in
        TestClass(a)
      }
    }

    Class(TestBasicClass.self) { 
      Constructor { (a: Int, b: String, c: Either<String, TestRecord>) in
        TestClass(a)
      }

      Property("TestIntProperty") { () -> Int in
        1
      }

      Property("TestEitherProperty") { () -> Either<Int, String> in
        1
      }

      Property("TestEnumProperty") { () -> TestEnum in
        .simpleCase
      }

      Property("TestRecordProperty") { () -> TestRecord2 in
        TestRecord2(1, "2")
      }

      AsyncFunction("TestAsyncFunction") { (a: Int) async -> String in 
        "string"
      }

      StaticAsyncFunction("TestStaticAsyncFunction") { (a: String) async -> Void in }

      StaticFunction("TestStaticFunction") { () async -> String in 
        "string"
      }
    }

    Class(TestEmptyClass.self) {
    }

    View(ExpoWebView.self) {
      Events("onEvent1", "onEvent2")

      Prop("url") { (view, url: URL) in
        if view.webView.url != url {
          let urlRequest = URLRequest(url: url)
          view.webView.load(urlRequest)
        }
      }

      Prop("testRecord") { (view, testRecord: TestRecord) in 
      }

      Prop("testRecord2") { (view, testRecord2: TestRecord2) in 
      }

      Prop("testRecordClass") { (view, testRecordClass: TestRecordClass) in 
      }

      Prop("testEnum") { (view, testEnum: TestEnum) in 
      }
    }
  }
}

struct TestRecord: Record {
  @Field
  var basicString: String
  @Field
  var basicStringInitialized: String = "utf8"
  @Field
  var basicIntInferred = 0
  @Field
  var basicDoubleInferred = 0.1
  @Field
  var basicStringInferred = "string"
  @Field
  var enumInferred = TestEnum.simpleCase
  @Field
  var complexEnumInferred = TestEnum.caseWithArgs1(2, 0.1, "Test")

  @Field
  var recordInferred = TestRecord2(field1: 21, field2: "testing")

  @Field
  var optionalInt: Int?
  @Field
  let letDoubleBinding: Double = 0.1

  var fieldWithoutAnnotation: Int = 1
}

struct TestRecord2: Record {
  @Field
  var field1: Int
  @Field
  var field2: String
}

class TestRecordClass: Record {
  @Field
  var field1: Int
  @Field
  var field2: String
}

enum TestEnum: String {
  case simpleCase
  case multipleCases1, multipleCases2
  case caseWithArgs1(Int, Double, String), caseWithArgs2(Double, String, Either<Int, String>)
}

enum IntBackedEnum1: Int {
  case simpleCase
  case multipleCases1, multipleCases2
}

enum IntBackedEnum2: Something, Int, SomethingElse {
  case simpleCase
}
// Global variable names
let globalEventName = "onGlobalEvent"

private let privateGlobalEventName = "onPrivateGlobalEvent"
private let globalAssignedToGlobal = globalEventName

enum EventNames {
  static let staticLetEvent = "onStaticLetEvent"
  static var staticVarEvent = "onStaticVarEvent"
}

struct EventStructNamespace {
  static let structEvent = "onStructEvent"
}

class EventClassNamespace {
  static let classEvent = "onClassEvent"
}

enum OuterNamespace {
  enum InnerNamespace {
    static let nestedEvent = "onNestedEvent"
  }
}
