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

  func setCategories(_ records: [CategoryRecord]) throws {
    let incoming = try validatedCategories(records)
    updateCategories(incoming)
  }

  func updateCategories(
    _ records: [CategoryRecord],
    merging merge: @Sendable (Set<UNNotificationCategory>, Set<UNNotificationCategory>) -> Set<UNNotificationCategory>
  ) async throws {
    let incoming = try validatedCategories(records)
    let current = await loadCategories()
    updateCategories(merge(current, incoming))
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

  private func validatedCategories(_ records: [CategoryRecord]) throws -> Set<UNNotificationCategory> {
    guard Set(records.map { Array($0.identifier.utf16) }).count == records.count else {
      throw Exception(name: "DuplicateCategoryIdentifier", description: "Could not replace notification categories because identifiers are duplicated. Use a unique identifier for each category.")
    }
    return Set(records.map { $0.toUNNotificationCategory() })
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
    try await categoryManager.setCategories(categories)
  }

  public final func updateNotificationCategories(
    _ categories: [CategoryRecord],
    merging merge: @Sendable (Set<UNNotificationCategory>, Set<UNNotificationCategory>) -> Set<UNNotificationCategory>
  ) async throws {
    try await categoryManager.updateCategories(categories, merging: merge)
  }

  open func setNotificationCategoryAsync(identifier: String, actions: [CategoryActionRecord], options: CategoryOptionsRecord?) async -> CategoryRecord {
    return await categoryManager.setCategory(identifier: identifier, actions: actions, options: options)
  }

  open func deleteNotificationCategoryAsync(identifier: String) async -> Bool {
    return await categoryManager.deleteCategory(identifier: identifier)
  }
}
