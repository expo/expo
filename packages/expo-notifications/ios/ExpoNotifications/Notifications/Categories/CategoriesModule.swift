//  Copyright © 2024 650 Industries. All rights reserved.

import ExpoModulesCore
import UIKit

actor CategoryManager {
  private var categories: Set<UNNotificationCategory>?

  func setCategory(identifier: String, actions: [CategoryActionRecord], options: CategoryOptionsRecord?) async -> CategoryRecord {
    let categoryRecord = CategoryRecord(identifier, actions: actions, options: options)
    let newCategory = categoryRecord.toUNNotificationCategory()

    let current = await loadCategories()
    let updated = current.filter { $0.identifier != identifier }.union([newCategory])

    await updateCategories(updated)
    return CategoryRecord(newCategory)
  }

  func deleteCategory(identifier: String) async -> Bool {
    let current = await loadCategories()
    let exists = current.contains { $0.identifier == identifier }

    if exists {
      let updated = current.filter { $0.identifier != identifier }
      await updateCategories(updated)
    }
    return exists
  }

  private func loadCategories() async -> Set<UNNotificationCategory> {
    if let cached = categories {
      return cached
    }
    let fresh = await UNUserNotificationCenter.current().notificationCategories()
    categories = fresh
    return fresh
  }

  private func updateCategories(_ newCategories: Set<UNNotificationCategory>) async {
    categories = newCategories
    UNUserNotificationCenter.current().setNotificationCategories(newCategories)
  }
}

open class CategoriesModule: Module {
  private let categoryManager = CategoryManager()

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
    return await categoryManager.setCategory(identifier: identifier, actions: actions, options: options)
  }

  open func deleteNotificationCategoryAsync(identifier: String) async -> Bool {
    return await categoryManager.deleteCategory(identifier: identifier)
  }
}
