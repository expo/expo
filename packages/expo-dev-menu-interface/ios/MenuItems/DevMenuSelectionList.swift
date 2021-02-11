// Copyright 2015-present 650 Industries. All rights reserved.

@objc
public class DevMenuSelectionList: DevMenuScreenItem {

  @objc
  public class Item: NSObject {
    @objc
    public class Tag : NSObject {
      @objc
      public var text: () -> String = { "" }

      @objc
      public var glyphName: () -> String? = { nil }
      
      fileprivate func serialize() -> [String : Any] {
        return [
          "text": text(),
          "glyphName": glyphName(),
        ]
      }
    }
    
    @objc
    public var title: () -> String = { "" }

    @objc
    public var warning: () -> String? = { nil }
    
    @objc
    public var isChecked: () -> Bool = { false }
    
    @objc
    public var tags: () -> [Tag] = { [] }
    
    fileprivate func serialize() -> [String : Any] {
      return [
        "title": title(),
        "warning": warning(),
        "isChecked": isChecked(),
        "tags": tags().map { $0.serialize() }
      ]
    }
  }
  
  private var items: [Item] = []
  
  @objc
  public func addItem(_ item: Item) {
    items.append(item)
  }
  
  @objc
  public init() {
    super.init(type: .SelectionList)
  }
  
  @objc
  public override func serialize() -> [String : Any] {
    var dict = super.serialize()
    dict["items"] = items.map { $0.serialize() }
    return dict
  }
  
}
