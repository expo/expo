//  Copyright © 2024 650 Industries. All rights reserved.

import ExpoModulesCore
import UIKit
import MachO

open class CategoriesModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoNotificationCategoriesModule")

    AsyncFunction("getNotificationCategoriesAsync") { (promise: Promise) in
      getNotificationCategoriesAsync(promise: promise)
    }

    AsyncFunction("setNotificationCategoryAsync") { (identifier: String, actions: [CategoryActionRecord], options: CategoryOptionsRecord?, promise: Promise) in
      setNotificationCategoryAsync(identifier: identifier, actions: actions, options: options, promise: promise)
    }

    AsyncFunction("deleteNotificationCategoryAsync") { (identifier: String, promise: Promise) in
      deleteNotificationCategoryAsync(identifier: identifier, promise: promise)
    }
  }

  public func getNotificationCategories(
    completion: @escaping (_ categoryRecords: [CategoryRecord]) -> Void,
    filter: @escaping (_ category: UNNotificationCategory) -> Bool
  ) {
    UNUserNotificationCenter.current().getNotificationCategories { categories in
      let existingCategories = categories
        .filter(filter)
        .map { category in
          return CategoryRecord(category)
        }
      completion(existingCategories)
    }
  }

  open func getNotificationCategoriesAsync(promise: Promise) {
    getNotificationCategories { categoryRecords in
      promise.resolve(categoryRecords)
    } filter: { _ in
      true
    }
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
