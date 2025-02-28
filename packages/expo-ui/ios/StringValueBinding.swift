// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

@available(iOS 17.0, *)
@Observable class ValueBindingObservable<T>: ValueBindingProtocol {
  var value: T
  init(_ value: T) {
    self.value = value
  }
}

class ValueBindingMock<T>: ValueBindingProtocol {
  var value: T
  
  init(_ value: T) {
    self.value = value
  }
}

protocol ValueBindingProtocol<T> {
  associatedtype T
  var value: T { get set }
}

class ValueBinding<T>: SharedObject {
  public var underlyingBinding: any ValueBindingProtocol<T>
  
  public var value: Binding<T> {
          Binding(
            get: {
              self.underlyingBinding.value
            },
              set: {
                self.underlyingBinding.value = $0
                self.emit(event: "onBindingValueChanged", arguments: ["newValue": $0])
              }
          )
      }
  
  init(_ value: T) {
    if #available(iOS 17.0, *) {
      underlyingBinding = ValueBindingObservable<T>(value)
    } else {
      underlyingBinding = ValueBindingMock<T>(value)
    }
  }
}
