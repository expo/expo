// Copyright 2022-present 650 Industries. All rights reserved.

/**
 Exception wrapper used to handle unexpected internal native errors.
 */
public class UnexpectedException: Exception {
  private let errorDescription: String

  public init(_ error: Error) {
    self.errorDescription = error.localizedDescription
  }

  public override var reason: String {
    return errorDescription
  }
}
