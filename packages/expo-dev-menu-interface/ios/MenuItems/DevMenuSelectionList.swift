// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc(EXDevMenuSelectionList)
public class DevMenuSelectionList: DevMenuScreenItem, DevMenuCallableProvider {
  @objc(EXDevMenuItem)
  public class Item: NSObject, DevMenuDataSourceItem {
    @objc(EXDevMenuTag)
    public class Tag: NSObject {
      @objc
      public var text: () -> String = { "" }

      @objc
      public var glyphName: () -> String? = { nil }

      fileprivate func serialize() -> [String: Any] {
        return [
          "text": text(),
          "glyphName": glyphName() ?? NSNull()
        ]
      }
    }

    @objc
    public var onClickData: () -> [String: Any]? = { nil }

    @objc
    public var title: () -> String = { "" }

    @objc
    public var warning: () -> String? = { nil }

    @objc
    public var isChecked: () -> Bool = { false }

    @objc
    public var tags: () -> [Tag] = { [] }

    public func serialize() -> [String: Any] {
      return [
        "title": title(),
        "warning": warning() ?? NSNull(),
        "isChecked": isChecked(),
        "tags": tags().map { $0.serialize() },
        "onClickData": onClickData() ?? NSNull()
      ]
    }
  }

  public static var ActionID = 1
  private let callable: DevMenuExportedFunction
  private var items: [Item] = []
  private let dataSourceId: String?

  @objc
  public func addItem(_ item: Item) {
    items.append(item)
  }

  @objc
  public convenience init() {
    self.init(dataSourceId: nil)
  }

  @objc
  public init(dataSourceId: String?) {
    self.dataSourceId = dataSourceId
    self.callable = DevMenuExportedFunction(withId: "expo-dev-menu.selection-list.#\(DevMenuSelectionList.ActionID)", withFunction: { _ in })
    DevMenuSelectionList.ActionID += 1
    super.init(type: .SelectionList)
  }

  @objc
  public override func serialize() -> [String: Any] {
    var dict = super.serialize()
    dict["items"] = items.map { $0.serialize() }
    dict["dataSourceId"] = dataSourceId ?? NSNull()
    dict["actionId"] = self.callable.id
    return dict
  }

  @objc
  public func addOnClick(hander: @escaping ([String: Any]?) -> Void) {
    self.callable.function = hander
  }

  public func registerCallable() -> DevMenuExportedCallable? {
    return self.callable
  }
}
