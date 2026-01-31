// Copyright 2025-present 650 Industries. All rights reserved.

internal import ExpoModulesJSI_Cxx

public struct JavaScriptHostObject: ~Copyable {
  public typealias GetClosure = (_ propertyName: String) -> JavaScriptValue
  public typealias SetClosure = (_ propertyName: String, _ value: consuming JavaScriptValue) -> Void
  public typealias GetPropertyNamesClosure = () -> [String]
  public typealias DeallocClosure = () -> Void

  internal weak var runtime: JavaScriptRuntime?
//  internal let pointee: expo.HostObject

//  public init(
//    _ runtime: JavaScriptRuntime,
//    get: @escaping GetClosure,
//    set: @escaping SetClosure,
//    getPropertyNames: @escaping GetPropertyNamesClosure,
//    dealloc: @escaping DeallocClosure
//  ) {
//    self.runtime = runtime
//    self.pointee = expo.HostObject(
//      { (propertyName: std.string) in
//        return get(String(propertyName)).pointee
//      },
//      { (propertyName: std.string, value: borrowing facebook.jsi.Value) in
//        set(String(propertyName), JavaScriptValue(runtime, value))
//      },
//      {
//        fatalError()
//      },
//      {
//        dealloc()
//      }
//    )
//  }
}
