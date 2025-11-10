import ExpoModulesCore
import WebKit

public class TestModule: Module {
  public func definition() -> ModuleDefinition {
    Constant("StringConstant") { () -> Int in
      return "Swift constant 1283"
    }
    
    Constant("IntConstant") { () -> Int in
      return 37;
    }

    Function("SimpleFunction") { (a: Double, b: Int) -> Double in
      return a + b
    }

    Function("TestEither") { (a: Either<Either<Int, String>, Either<Float, Double>>) -> Either<String, Either<Int, Double>> in 
      return "test"
    }

    Function("TestArrays") { (a: [Int]) -> [[String]] in 
      return ["test"]
    }

    Function("TestDictionaries") { (a: [Int: String], b: [[Int : String] : [Float : String]]) -> Any in 
      return "test"
    }

    Function("TestParametrizedTypes") { (a: Set<Either<Int, String>, Map<Set<Int>, Either<Set<Int>, Set<String>>>>) -> String in
      return ""
    }

    Function("TestTypeCombinations") { (a: [[[Int]]]) -> [[Either<String, [Int: String]>]] in 
      return [["test"]]
    }

    AsyncFunction("TestSimpleAsyncFunction") { (a: String, b: String) async ->  String in
      return a + b
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

      // TODO check this - does nothing - should it do anything?
      // Constant("TestConstant") { () -> String in
      //   "test"
      // }
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

      Property("TestParametrizedProperty") { () -> [Either<Int, [Either<String, Double> : Set<[TestEnum]>]>] in
        1
      }

      Function("TestComplexFunction") { (a: [[[Int]]], b: Either<String, [Int: [Int]]>) -> [Either<Int, [Either<String, Double> : Set<[TestEnum]>]>] in
        "string"
      }

      AsyncFunction("TestAsyncFunction") { (a: Int) async -> String in 
        "string"
      }
    }

    Class(TestClassWithConstructor.self) { 
      Constructor { (a: Int) in
        TestClass(a)
      }
    }

    Class(TestEmptyClass.self) {
    }

    View(TestView.self) {
      Prop("TestProp") 
    }

    // TODO check if multiple views should be allowed
    View(ExpoWebView.self) {
      Events("onEvent1", "onEvent2")
      // TODO check if multiple Events should be allowed
      Events("onEvent3", "onEvent4")

      Prop("testProp") { (view, testProp: URL) in
        if view.webView.url != testProp {
          let urlRequest = URLRequest(url: testProp)
          view.webView.load(urlRequest)
        }
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

  // TODO check what we actually want to do for unannotated fields
  var fieldWithoutAnnotation: Int = 1
}

struct TestRecord2: Record {
  @Field
  var field1: Int
  @Field
  var field2: String
}

enum TestEnum {
  case simpleCase
  case multipleCases1, multipleCases2
  case caseWithArgs1(Int, Double, String), caseWithArgs2(Double, String, Either<Int, String>)
}
