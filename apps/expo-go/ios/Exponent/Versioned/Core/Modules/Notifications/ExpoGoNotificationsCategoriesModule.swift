// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import ExpoNotifications

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

  public override func filterAndSerializeCategories(_ categories: Set<UNNotificationCategory>) -> [CategoryRecord] {
    return categories
      .filter {
        EXScopedNotificationsUtils.isId($0.identifier, scopedByExperience: self.scopeKey)
      }
      .map { category in
        let record = CategoryRecord(category)
        record.identifier = EXScopedNotificationsUtils.getUnscopedIdentifier(fromScopedIdentifier: record.identifier)
        return record
      }
  }

  public override func setNotificationCategoryAsync(
    identifier: String,
    actions: [CategoryActionRecord],
    options: CategoryOptionsRecord?
  ) async -> CategoryRecord {
    let scopedIdentifier = EXScopedNotificationsUtils.scopedIdentifier(fromId: identifier, forExperience: scopeKey)
    return await super.setNotificationCategoryAsync(identifier: scopedIdentifier, actions: actions, options: options)
  }

  public override func deleteNotificationCategoryAsync(identifier: String) async -> Bool {
    let scopedIdentifier = EXScopedNotificationsUtils.scopedIdentifier(fromId: identifier, forExperience: scopeKey)
    return await super.deleteNotificationCategoryAsync(identifier: scopedIdentifier)
  }
}
