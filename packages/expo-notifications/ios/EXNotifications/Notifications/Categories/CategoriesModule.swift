//  Copyright © 2024 650 Industries. All rights reserved.

import ExpoModulesCore
import UIKit
import MachO

open class CategoriesModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoNotificationCategoriesModule")

    AsyncFunction("getNotificationCategoriesAsync") {
      let categories = await UNUserNotificationCenter.current().notificationCategories()
      let existingCategories = categories.map { category in
        return CategoryRecord(category)
      }
      return existingCategories
    }
      let categories = await UNUserNotificationCenter.current().notificationCategories()
      promise.resolve(filterAndSerializeCategories(Array(categories)))
    }

  AsyncFunction("setNotificationCategoryAsync") { (identifier: String, actions: [CategoryActionRecord], options: CategoryOptionsRecord?) in
     return await setNotificationCategoryAsync(identifier: identifier, actions: actions, options: options)
    }
      setNotificationCategoryAsync(identifier: identifier, actions: actions, options: options, promise: promise)
    }

    AsyncFunction("deleteNotificationCategoryAsync") { (identifier: String, promise: Promise) in
      return await deleteNotificationCategoryAsync(identifier: identifier)
    }
  }

  open func filterAndSerializeCategories(_ categories: [UNNotificationCategory]) -> [CategoryRecord] {
    return categories.map { CategoryRecord($0) }
  }

  
  func setNotificationCategoryAsync(identifier: String, actions: [CategoryActionRecord], options: CategoryOptionsRecord?) async -> CategoryRecord {
    let categoryRecord = CategoryRecord(identifier, actions: actions, options: options)
    let newNotificationCategory = categoryRecord.toUNNotificationCategory()
    let oldcategories = await UNUserNotificationCenter.current().notificationCategories()
    let newCategories = Set(oldcategories.filter { oldCategory in
      return oldCategory.identifier != newNotificationCategory.identifier
    }.union([newNotificationCategory]))
    UNUserNotificationCenter.current().setNotificationCategories(newCategories)
    return CategoryRecord(newNotificationCategory)
  }

open func deleteNotificationCategoryAsync(identifier: String) async -> Bool {
    let oldCategories = await UNUserNotificationCenter.current().notificationCategories()
    let didDelete = oldCategories.contains { oldCategory in
      return oldCategory.identifier == identifier
    }
    if didDelete {
      let newCategories = Set(oldCategories.filter { oldCategory in
        return oldCategory.identifier != identifier
      })
      UNUserNotificationCenter.current().setNotificationCategories(newCategories)
    }
    return didDelete
  }
}
