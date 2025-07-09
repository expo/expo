// Copyright 2022-present 650 Industries. All rights reserved.

/**
 The exception that needs some additional parameters to be best described.
 */
open class GenericException<ParamType>: Exception {
  /**
   The additional parameter passed to the initializer.
   */
  public let param: ParamType

  /**
   The default initializer that takes a param and captures the place in the code where the exception was created.
   - Warning: Call it only with one argument! If you need to pass more parameters, use a tuple instead.
   */
  public init(_ param: ParamType, file: String = #fileID, line: UInt = #line, function: String = #function) {
    self.param = param
    super.init(file: file, line: line, function: function)
  }
}
