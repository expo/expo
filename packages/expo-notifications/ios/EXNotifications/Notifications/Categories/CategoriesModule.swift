//  Copyright © 2024 650 Industries. All rights reserved.

import ExpoModulesCore
import UIKit
import MachO

open class CategoriesModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoNotificationCategoriesModule")

    AsyncFunction("getNotificationCategoriesAsync") { (promise: Promise) in
      let categories = await UNUserNotificationCenter.current().notificationCategories()
      promise.resolve(filterAndSerializeCategories(Array(categories)))
    }

    AsyncFunction("setNotificationCategoryAsync") { (identifier: String, actions: [CategoryActionRecord], options: CategoryOptionsRecord?, promise: Promise) in
      setNotificationCategoryAsync(identifier: identifier, actions: actions, options: options, promise: promise)
    }

    AsyncFunction("deleteNotificationCategoryAsync") { (identifier: String, promise: Promise) in
      deleteNotificationCategoryAsync(identifier: identifier, promise: promise)
    }
  }

  open func filterAndSerializeCategories(_ categories: [UNNotificationCategory]) -> [CategoryRecord] {
    return categories.map { CategoryRecord($0) }
  }

  open func setNotificationCategoryAsync(identifier: String, actions: [CategoryActionRecord], options: CategoryOptionsRecord?, promise: Promise) {
    let categoryRecord = CategoryRecord(identifier, actions: actions, options: options)
    let newNotificationCategory = categoryRecord.toUNNotificationCategory()
    UNUserNotificationCenter.current().getNotificationCategories { oldcategories in
      let newCategories = Set(oldcategories.filter { oldCategory in
        return oldCategory.identifier != newNotificationCategory.identifier
      }
      .union([newNotificationCategory]))
      UNUserNotificationCenter.current().setNotificationCategories(newCategories)
      promise.resolve(CategoryRecord(newNotificationCategory))
    }
  }

  open func deleteNotificationCategoryAsync(identifier: String, promise: Promise) {
    UNUserNotificationCenter.current().getNotificationCategories { oldCategories in
      let didDelete = oldCategories.contains { oldCategory in
        return oldCategory.identifier == identifier
      }
      if didDelete {
        let newCategories = Set(oldCategories.filter { oldCategory in
          return oldCategory.identifier != identifier
        })
        UNUserNotificationCenter.current().setNotificationCategories(newCategories)
      }
      promise.resolve(didDelete)
    }
  }
}
