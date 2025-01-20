//  Copyright © 2024 650 Industries. All rights reserved.

import ExpoModulesCore
import UIKit
import MachO

public class CategoriesModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoNotificationCategoriesModule")

    AsyncFunction("getNotificationCategoriesAsync") { (promise: Promise) in
      UNUserNotificationCenter.current().getNotificationCategories { categories in
        let existingCategories = categories.map { self.serializeCategory($0) }
        promise.resolve(existingCategories)
      }
    }

    AsyncFunction("setNotificationCategoryAsync") { (identifier: String, actions: [CategoryActionRecord], options: CategoryOptionsRecord?, promise: Promise) in
      let newCategory = categoryFromParams(identifier, actions: actions, options: options)
      UNUserNotificationCenter.current().getNotificationCategories { oldcategories in
        let newCategories = Set(oldcategories.filter { $0.identifier != newCategory.identifier }.union([newCategory]))
        UNUserNotificationCenter.current().setNotificationCategories(newCategories)
        promise.resolve(self.serializeCategory(newCategory))
      }
    }

    AsyncFunction("deleteNotificationCategoryAsync") { (identifier: String, promise: Promise) in
      UNUserNotificationCenter.current().getNotificationCategories { oldCategories in
        let newCategories = Set(oldCategories.filter { $0.identifier != identifier })
        let didDelete = oldCategories.contains { $0.identifier == identifier }
        if didDelete {
          UNUserNotificationCenter.current().setNotificationCategories(newCategories)
        }
        promise.resolve(didDelete)
      }
    }
  }

  func categoryFromParams(_ id: String, actions: [CategoryActionRecord], options: CategoryOptionsRecord?) -> UNNotificationCategory {
    let intentIdentifiers: [String] = options?.intentIdentifiers as? [String] ?? []
    let previewPlaceholder: String? = options?.previewPlaceholder as? String
    let categorySummaryFormat: String? = options?.categorySummaryFormat as? String
    let actionsArray = actions.compactMap { actionFromParams($0) }
    let categoryOptions: UNNotificationCategoryOptions = categoryOptionsFromParams(options)
    return UNNotificationCategory(
      identifier: id,
      actions: actionsArray,
      intentIdentifiers: intentIdentifiers,
      hiddenPreviewsBodyPlaceholder: previewPlaceholder,
      categorySummaryFormat: categorySummaryFormat,
      options: categoryOptions
    )
  }

  func actionFromParams(_ params: CategoryActionRecord) -> UNNotificationAction? {
    guard let identifier = params.identifier,
      let buttonTitle = params.buttonTitle else {
      return nil
    }
    var options: UNNotificationActionOptions = []
    if let optionsParams = params.options {
      if optionsParams.opensAppToForeground == true {
        options.insert(.foreground)
      }
      if optionsParams.isDestructive == true {
        options.insert(.destructive)
      }
      if optionsParams.isAuthenticationRequired == true {
        options.insert(.authenticationRequired)
      }
    }
    if let textInput = params.textInput {
      return UNTextInputNotificationAction(
        identifier: identifier,
        title: buttonTitle,
        textInputButtonTitle: textInput.submitButtonTitle ?? "",
        textInputPlaceholder: textInput.placeholder ?? ""
      )
    }
    return UNNotificationAction(identifier: identifier, title: buttonTitle, options: options)
  }

  func categoryOptionsFromParams(_ params: CategoryOptionsRecord?) -> UNNotificationCategoryOptions {
    var options: UNNotificationCategoryOptions = []
    if params?.customDismissAction == true {
      options.insert(.customDismissAction)
    }
    if params?.allowInCarPlay == true {
      options.insert(.allowInCarPlay)
    }
    // allowAnnouncement deprecated in iOS 15 and later
    /*
    if params?.allowAnnouncement as? Bool ?? false {
      options.insert(.allowAnnouncement)
    }
     */
    if params?.showTitle == true {
      options.insert(.hiddenPreviewsShowTitle)
    }
    if params?.showSubtitle == true {
      options.insert(.hiddenPreviewsShowSubtitle)
    }
    return options
  }

  func serializeCategory(_ category: UNNotificationCategory) -> CategoryRecord {
    let record = CategoryRecord()
    record.identifier = category.identifier
    record.actions = serializeActions(category.actions)
    record.options = serializeCategoryOptions(category)
    return record
  }

  func serializeActions(_ actions: [UNNotificationAction]) -> [CategoryActionRecord] {
    return actions.map { action in
      let serializedAction = CategoryActionRecord()
      serializedAction.identifier = action.identifier
      serializedAction.buttonTitle = action.title
      serializedAction.options = serializeActionOptions(action.options)
      if let textInputAction = action as? UNTextInputNotificationAction {
        let serializedActionTextInput = CategoryActionTextInputOptionsRecord()
        serializedActionTextInput.placeholder = textInputAction.textInputPlaceholder
        serializedActionTextInput.submitButtonTitle = textInputAction.textInputButtonTitle
        serializedAction.textInput = serializedActionTextInput
      }
      return serializedAction
    }
  }

  func serializeCategoryOptions(_ category: UNNotificationCategory) -> CategoryOptionsRecord {
    let record = CategoryOptionsRecord()
    // allowAnnouncement deprecated in iOS 15 and later
    // record.allowAnnouncement = category.options.contains(.allowAnnouncement)
    record.allowInCarPlay = category.options.contains(.allowInCarPlay)
    record.categorySummaryFormat = category.categorySummaryFormat
    record.customDismissAction = category.options.contains(.customDismissAction)
    record.intentIdentifiers = category.intentIdentifiers
    record.previewPlaceholder = category.hiddenPreviewsBodyPlaceholder
    record.showTitle = category.options.contains(.hiddenPreviewsShowTitle)
    record.showSubtitle = category.options.contains(.hiddenPreviewsShowSubtitle)
    return record
  }

  func serializeActionOptions(_ options: UNNotificationActionOptions) -> CategoryActionOptionsRecord {
    let record = CategoryActionOptionsRecord()
    record.isDestructive = options.contains(.destructive)
    record.isAuthenticationRequired = options.contains(.authenticationRequired)
    record.opensAppToForeground = options.contains(.foreground)
    return record
  }
}
