// Copyright 2022-present 650 Industries. All rights reserved.

open class ViewProps: ObservableObject, Record {
  @Published
  public var rawValue: [String: Any] = [:]

  public required init() {}
}
