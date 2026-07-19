// Copyright 2022-present 650 Industries. All rights reserved.

/**
 Exception wrapper used to handle unexpected internal native errors.
 */
public class UnexpectedException: Exception {
  private let errorDescription: String

  public init(_ error: Error, file: String = #fileID, line: UInt = #line, function: String = #function) {
    self.errorDescription = error.localizedDescription
    super.init(file: file, line: line, function: function)
  }

  public override var reason: String {
    return errorDescription
  }
}
