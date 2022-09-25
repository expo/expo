// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc
public protocol DevMenuDataSourceItem {
  @objc
  func serialize() -> [String: Any]
}

public typealias DevMenuDataSourceResolver = ([DevMenuDataSourceItem]) -> Void

@objc
public protocol DevMenuDataSourceProtocol {
  var id: String { get }

  func fetchData(resolve: @escaping DevMenuDataSourceResolver)
}

@objc
public class DevMenuListDataSource: NSObject, DevMenuDataSourceProtocol {
  public var id: String
  private var dataFetcher: (@escaping ([DevMenuSelectionList.Item]) -> Void) -> Void

  public init(id: String, dataFetcher: @escaping (@escaping ([DevMenuSelectionList.Item]) -> Void) -> Void) {
    self.id = id
    self.dataFetcher = dataFetcher
  }

  public func fetchData(resolve: @escaping ([DevMenuDataSourceItem]) -> Void) {
    dataFetcher(resolve)
  }
}
