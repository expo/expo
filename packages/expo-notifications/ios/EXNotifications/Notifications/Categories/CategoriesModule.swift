//  Copyright © 2024 650 Industries. All rights reserved.

import ExpoModulesCore
import UIKit
import MachO

public class CategoriesModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoNotificationCategoriesModule")

    AsyncFunction("getNotificationCategoriesAsync") { (promise: Promise) in
      UNUserNotificationCenter.current().getNotificationCategories { categories in
        let existingCategories = categories.map { category in
          return CategoryRecord(category)
        }
        promise.resolve(existingCategories)
      }
    }

    AsyncFunction("setNotificationCategoryAsync") { (identifier: String, actions: [CategoryActionRecord], options: CategoryOptionsRecord?, promise: Promise) in
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

    AsyncFunction("deleteNotificationCategoryAsync") { (identifier: String, promise: Promise) in
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
}
