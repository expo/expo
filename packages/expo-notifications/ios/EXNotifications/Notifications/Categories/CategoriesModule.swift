//  Copyright © 2024 650 Industries. All rights reserved.

import ExpoModulesCore
import UIKit
import MachO

public class CategoriesModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoNotificationCategoriesModule")

    AsyncFunction("getNotificationCategoriesAsync") { (promise: Promise) in
      UNUserNotificationCenter.current().getNotificationCategories { categories in
        var existingCategories: [[String: Any]] = []
        categories.forEach { category in
          existingCategories.append(self.serializeCategory(category))
        }
        promise.resolve(existingCategories)
      }
    }

    AsyncFunction("setNotificationCategoryAsync") { (identifier: String, actions: [[String: Any]], options: [String: Any]?, promise: Promise) in
      let newCategory = categoryFromParams(identifier, actions: actions, options: options)
      UNUserNotificationCenter.current().getNotificationCategories { oldcategories in
        var newCategories: Set<UNNotificationCategory> = Set<UNNotificationCategory>()
        oldcategories.forEach { category in
          if category.identifier != newCategory.identifier {
            newCategories.insert(category)
          }
        }
        newCategories.insert(newCategory)
        UNUserNotificationCenter.current().setNotificationCategories(newCategories)
        promise.resolve(self.serializeCategory(newCategory))
      }
    }

    AsyncFunction("deleteNotificationCategoryAsync") { (identifier: String, promise: Promise) in
      UNUserNotificationCenter.current().getNotificationCategories { oldcategories in
        var newCategories: Set<UNNotificationCategory> = Set<UNNotificationCategory>()
        var didDelete = false
        oldcategories.forEach { category in
          if category.identifier == identifier {
            didDelete = true
          } else {
            newCategories.insert(category)
          }
        }
        if didDelete {
          UNUserNotificationCenter.current().setNotificationCategories(newCategories)
        }
        promise.resolve(didDelete)
      }
    }
  }

  func categoryFromParams(_ id: String, actions: [[String: Any]], options: [String: Any]?) -> UNNotificationCategory {
    let intentIdentifiers: [String] = options?["intentIdentifiers"] as? [String] ?? []
    let previewPlaceholder: String? = options?["previewPlaceholder"] as? String
    let categorySummaryFormat: String? = options?["categorySummaryFormat"] as? String
    var actionsArray: [UNNotificationAction] = []
    actions.forEach { actionParams in
      if let action = actionFromParams(actionParams) {
        actionsArray.append(action)
      }
    }
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

  func actionFromParams(_ params: [String: Any]) -> UNNotificationAction? {
    guard let identifier = params["identifier"] as? String,
      let buttonTitle = params["buttonTitle"] as? String else {
      return nil
    }
    var options: UNNotificationActionOptions = []
    if let optionsParams = params["options"] as? [String: Any] {
      if optionsParams["opensAppToForeground"] as? Bool ?? false {
        options.insert(.foreground)
      }
      if optionsParams["isDestructive"] as? Bool ?? false {
        options.insert(.destructive)
      }
      if optionsParams["isAuthenticationRequired"] as? Bool ?? false {
        options.insert(.authenticationRequired)
      }
    }
    if let textInput = params["textInput"] as? [String: String] {
      return UNTextInputNotificationAction(
        identifier: identifier,
        title: buttonTitle,
        textInputButtonTitle: textInput["submitButtonTitle"] ?? "",
        textInputPlaceholder: textInput["placeholder"] ?? ""
      )
    }
    return UNTextInputNotificationAction(identifier: identifier, title: buttonTitle, options: options)
  }

  func categoryOptionsFromParams(_ params: [String: Any]?) -> UNNotificationCategoryOptions {
    var options: UNNotificationCategoryOptions = []
    if params?["customDismissAction"] as? Bool ?? false {
      options.insert(.customDismissAction)
    }
    if params?["allowInCarPlay"] as? Bool ?? false {
      options.insert(.allowInCarPlay)
    }
    if params?["showTitle"] as? Bool ?? false {
      options.insert(.hiddenPreviewsShowTitle)
    }
    if params?["showSubtitle"] as? Bool ?? false {
      options.insert(.hiddenPreviewsShowSubtitle)
    }
    return options
  }

  func serializeCategory(_ category: UNNotificationCategory) -> [String: Any] {
    return [
      "identifier": category.identifier,
      "actions": serializeActions(category.actions),
      "options": serializeCategoryOptions(category)
    ]
  }

  func serializeActions(_ actions: [UNNotificationAction]) -> [[String: Any]] {
    return actions.map { action in
      var serializedAction: [String: Any] = [
        "identifier": action.identifier,
        "title": action.title,
        "options": serializeActionOptions(action.options)
      ]
      if let textInputAction = action as? UNTextInputNotificationAction {
        serializedAction["textInput"] = [
          "placeholder": textInputAction.textInputPlaceholder,
          "submitButtonTitle": textInputAction.textInputButtonTitle
        ]
      }
      return serializedAction
    }
  }

  func serializeCategoryOptions(_ category: UNNotificationCategory) -> [String: Any] {
    return [
      "allowAnnouncement": category.options.contains(.allowAnnouncement),
      "allowInCarPlay": category.options.contains(.allowInCarPlay),
      "categorySummaryFormat": category.categorySummaryFormat,
      "customDismissAction": category.options.contains(.customDismissAction),
      "intentIdentifiers": category.intentIdentifiers,
      "previewPlaceholder": category.hiddenPreviewsBodyPlaceholder,
      "showTitle": category.options.contains(.hiddenPreviewsShowTitle),
      "showSubtitle": category.options.contains(.hiddenPreviewsShowSubtitle)
    ]
  }

  func serializeActionOptions(_ options: UNNotificationActionOptions) -> [String: Any] {
    return [
      "destructive": options.contains(.destructive),
      "authenticationRequired": options.contains(.authenticationRequired),
      "foreground": options.contains(.foreground)
    ]
  }
}
