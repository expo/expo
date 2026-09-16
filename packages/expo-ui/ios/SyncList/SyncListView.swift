// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 Hosts `ExpoUISyncListView`, which is written in Objective-C++ because it creates a React root per
 row and borrows the JavaScript runtime to render one, neither of which Swift can reach.
 */
public final class SyncListView: ExpoView {
  private let list = ExpoUISyncListView()

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    // The presenter owns the runtime scheduler and the mounting manager that a row's surface needs.
    list.surfacePresenter = appContext?.reactSurfacePresenter
    addSubview(list)
  }

  public override func layoutSubviews() {
    super.layoutSubviews()
    list.frame = bounds
  }

  public func setListId(_ listId: String) {
    list.listId = listId
  }

  public func setItemCount(_ itemCount: Int) {
    list.itemCount = itemCount
  }

  public func setRenderVersion(_ version: Int) {
    list.renderVersion = version
  }

  public func setEstimatedItemSize(_ estimatedItemSize: Double) {
    list.estimatedItemSize = estimatedItemSize
  }
}
