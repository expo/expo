// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import EXNotifications

public final class ExpoGoNotificationsCategoriesModule: CategoriesModule {
  private let scopeKey: String
  // swiftlint:disable:next unavailable_function
  required init(appContext: AppContext) {
    fatalError("Initializer not implemented, use init(appContext:scopeKey:) instead")
  }

  required init(appContext: AppContext, scopeKey: String) {
    self.scopeKey = scopeKey

    super.init(appContext: appContext)
  }

  public override func filterAndSerializeCategories(_ categories: [UNNotificationCategory]) -> [CategoryRecord] {
    return categories
      .filter {
        EXScopedNotificationsUtils.isId($0.identifier, scopedByExperience: self.scopeKey)
      }
      .map { category in
        var record = CategoryRecord(category)
        record.identifier = EXScopedNotificationsUtils.getUnscopedIdentifier(fromScopedIdentifier: record.identifier)
        return record
      }
  }

  public override func setNotificationCategoryAsync(identifier: String, actions: [CategoryActionRecord], options: CategoryOptionsRecord?, promise: Promise) {
    let scopedIdentifier = EXScopedNotificationsUtils.scopedIdentifier(fromId: identifier, forExperience: scopeKey)
    super.setNotificationCategoryAsync(identifier: scopedIdentifier, actions: actions, options: options, promise: promise)
  }

  public override func deleteNotificationCategoryAsync(identifier: String, promise: Promise) {
    let scopedIdentifier = EXScopedNotificationsUtils.scopedIdentifier(fromId: identifier, forExperience: scopeKey)
    super.deleteNotificationCategoryAsync(identifier: scopedIdentifier, promise: promise)
  }
}
