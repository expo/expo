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

    updateCategories(updated)
    return CategoryRecord(newCategory)
  }

  func deleteCategory(identifier: String) async -> Bool {
    let current = await loadCategories()
    let exists = current.contains { $0.identifier == identifier }

    if exists {
      let updated = current.filter { $0.identifier != identifier }
      updateCategories(updated)
    }
    return exists
  }

  func setCategories(_ categories: [CategoryRecord], replacing replaces: @Sendable (String) -> Bool) async throws {
    guard Set(categories.map { $0.identifier }).count == categories.count else {
      throw Exception(name: "DuplicateCategoryIdentifier", description: "Could not replace notification categories because identifiers are duplicated. Use a unique identifier for each category.")
    }
    let kept = await loadCategories().filter { !replaces($0.identifier) }
    updateCategories(kept.union(categories.map { $0.toUNNotificationCategory() }))
  }

  private func loadCategories() async -> Set<UNNotificationCategory> {
    if let cached = categories {
      return cached
    }
    let fresh = await UNUserNotificationCenter.current().notificationCategories()
    if let cached = categories {
      return cached
    }
    categories = fresh
    return fresh
  }

  private func updateCategories(_ newCategories: Set<UNNotificationCategory>) {
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

    AsyncFunction("setNotificationCategoriesAsync") { (categories: [CategoryRecord]) in
      try await setNotificationCategoriesAsync(categories: categories)
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

  open func setNotificationCategoriesAsync(categories: [CategoryRecord]) async throws {
    try await replaceNotificationCategories(categories) { _ in true }
  }

  public final func replaceNotificationCategories(
    _ categories: [CategoryRecord],
    replacing replaces: @Sendable (String) -> Bool
  ) async throws {
    try await categoryManager.setCategories(categories, replacing: replaces)
  }

  open func setNotificationCategoryAsync(identifier: String, actions: [CategoryActionRecord], options: CategoryOptionsRecord?) async -> CategoryRecord {
    return await categoryManager.setCategory(identifier: identifier, actions: actions, options: options)
  }

  open func deleteNotificationCategoryAsync(identifier: String) async -> Bool {
    return await categoryManager.deleteCategory(identifier: identifier)
  }
}
