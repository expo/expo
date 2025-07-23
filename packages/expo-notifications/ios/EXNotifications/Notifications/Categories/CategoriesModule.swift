//  Copyright © 2024 650 Industries. All rights reserved.

import ExpoModulesCore
import UIKit
import MachO

open class CategoriesModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoNotificationCategoriesModule")

    AsyncFunction("getNotificationCategoriesAsync") {
      let categories = await UNUserNotificationCenter.current().notificationCategories()
      return filterAndSerializeCategories(categories)
    }

    AsyncFunction("setNotificationCategoryAsync") { (identifier: String, actions: [CategoryActionRecord], options: CategoryOptionsRecord?) in
      return await setNotificationCategoryAsync(identifier: identifier, actions: actions, options: options)
    }

    AsyncFunction("deleteNotificationCategoryAsync") { (identifier: String) in
      return await deleteNotificationCategoryAsync(identifier: identifier)
    }
  }

  open func filterAndSerializeCategories(_ categories: Set<UNNotificationCategory>) -> [CategoryRecord] {
    return categories.map { CategoryRecord($0) }
  }

  open func setNotificationCategoryAsync(identifier: String, actions: [CategoryActionRecord], options: CategoryOptionsRecord?) async -> CategoryRecord {
    let categoryRecord = CategoryRecord(identifier, actions: actions, options: options)
    let newNotificationCategory = categoryRecord.toUNNotificationCategory()
    let oldCategories = await UNUserNotificationCenter.current().notificationCategories()
    let newCategories = oldCategories
        .filter { oldCategory in
          return oldCategory.identifier != newNotificationCategory.identifier
        }
        .union([newNotificationCategory])
    UNUserNotificationCenter.current().setNotificationCategories(newCategories)
    return CategoryRecord(newNotificationCategory)
  }

  open func deleteNotificationCategoryAsync(identifier: String) async -> Bool {
    let oldCategories = await UNUserNotificationCenter.current().notificationCategories()
    let didDelete = oldCategories.contains { oldCategory in
      return oldCategory.identifier == identifier
    }
    if didDelete {
      let newCategories = oldCategories.filter { oldCategory in
        return oldCategory.identifier != identifier
      }
      UNUserNotificationCenter.current().setNotificationCategories(newCategories)
    }
    return didDelete
  }
}
