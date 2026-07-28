import SwiftUI
import WidgetKit
import Foundation

public struct WidgetConfigurationOption {
  public let name: String
  public let value: String
  public let subtitle: String?

  public init(name: String, value: String, subtitle: String? = nil) {
    self.name = name
    self.value = value
    self.subtitle = subtitle
  }
}

func parseTimeline(identifier: String, name: String, family: WidgetFamily) -> [WidgetsTimelineEntry] {
  guard let timeline = WidgetsStorage.getArray(forKey: "__expo_widgets_\(name)_timeline") else {
    return [WidgetsTimelineEntry(date: Date(), name: name, props: WidgetsLayoutRegistry.initialProps(for: name), entryIndex: nil)]
  }

  let entries: [WidgetsTimelineEntry?] = timeline.enumerated().map { index, entry in
    if let entry = entry as? [String: Any], let timestamp = entry["timestamp"] as? Int, let props = entry["props"] as? [String: Any] {
      return WidgetsTimelineEntry(
        date: Date(timeIntervalSince1970: Double(timestamp) / 1000),
        name: name,
        props: props,
        entryIndex: index
      )
    }
    return nil
  }

  return entries.compactMap(\.self)
}

public func widgetConfigurationOptions(
  name: String,
  parameter: String,
  fallback: [WidgetConfigurationOption]
) -> [WidgetConfigurationOption] {
  guard let options = WidgetsStorage.getArray(forKey: "__expo_widgets_\(name)_configuration_options_\(parameter)") else {
    return fallback
  }

  let parsedOptions: [WidgetConfigurationOption] = options.compactMap { option in
    guard let option = option as? [String: Any],
          let name = option["name"] as? String,
          let value = option["value"] as? String else {
      return nil
    }
    return WidgetConfigurationOption(name: name, value: value, subtitle: option["subtitle"] as? String)
  }
  return parsedOptions.isEmpty ? fallback : parsedOptions
}

public func createRedBox(message: String, stack: String? = nil) -> [String: Any] {
  var props: [String: Any] = ["message": message]
  if let stack {
    props["stack"] = stack
  }
  return ["type": "RedBoxView", "props": props]
}

public func evaluateLayout(
  layout: String,
  props: [String: Any]?,
  environment: [String: Any]
) -> [String: Any] {
  switch evaluateWidgetLayout(layout: layout, props: props, environment: environment) {
  case .success(let result):
    return result
  case .failure(let error):
    print("[ExpoWidgets] Layout evaluation failed: \(error.message)")
    return createRedBox(message: error.message)
  }
}

func getLiveActivityNodes(forName name: String, props: String? = nil, environment: [String: Any]) -> [String: Any] {
  let layout = WidgetsStorage.getString(forKey: "__expo_widgets_live_activity_\(name)_layout") ?? ""
  let propsDict = props.flatMap { props in
    props.data(using: .utf8).flatMap {
      try? JSONSerialization.jsonObject(with: $0, options: []) as? [String: Any]
    }
  }

  switch evaluateWidgetLayout(layout: layout, props: propsDict, environment: environment) {
  case .success(let result):
    return result
  case .failure(let error):
    print("[ExpoWidgets] Layout evaluation failed: \(error.message)")
    return ["banner": createRedBox(message: error.message)]
  }
}

func getLiveActivityUrl(forName name: String) -> URL? {
  guard let urlString = WidgetsStorage.getString(forKey: "__expo_widgets_live_activity_\(name)_url") else {
    return nil
  }
  return URL(string: urlString)
}

public func getWidgetEnvironment(environment: EnvironmentValues) -> [String: Any] {
  var env: [String: Any] = [
    "showsContainerBackground": environment.showsWidgetContainerBackground,
    "widgetFamily": environment.widgetFamily.description,
    "colorScheme": "\(environment.colorScheme)"
  ]

  if #available(iOS 16.0, *) {
    env["isLuminanceReduced"] = environment.isLuminanceReduced
    env["widgetRenderingMode"] = environment.widgetRenderingMode.description
    env["showsWidgetLabel"] = environment.showsWidgetLabel
  }
  if #available(iOS 17.0, *) {
    env["widgetContentMargins"] = [
      "top": environment.widgetContentMargins.top,
      "bottom": environment.widgetContentMargins.bottom,
      "leading": environment.widgetContentMargins.leading,
      "trailing": environment.widgetContentMargins.trailing,
    ]
  }
  if #available(iOS 26.0, *) {
    env["levelOfDetail"] = environment.levelOfDetail == .simplified ? "simplified" : environment.levelOfDetail == .default ? "default" : nil
  }
  return env
}

func getLiveActivityEnvironment(environment: EnvironmentValues) -> [String: Any] {
  var env: [String: Any] = [
    "colorScheme": "\(environment.colorScheme)"
  ]

  if #available(iOS 16.0, *) {
    env["isLuminanceReduced"] = environment.isLuminanceReduced
  }
  if #available(iOS 16.1, *) {
    env["isActivityFullscreen"] = environment.isActivityFullscreen
  }
  if #available(iOS 18.0, *) {
    env["isActivityUpdateReduced"] = environment.isActivityUpdateReduced
    env["activityFamily"] = "\(environment.activityFamily)"
  }
  if #available(iOS 26.0, *) {
    env["levelOfDetail"] = environment.levelOfDetail == .simplified ? "simplified" : environment.levelOfDetail == .default ? "default" : nil
  }
  return env
}
