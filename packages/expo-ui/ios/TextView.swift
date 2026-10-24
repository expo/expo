// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

public enum TextDateStyle: String, Enumerable {
  case timer, relative, offset, date, time

  func toSwiftUI() -> SwiftUI.Text.DateStyle {
    switch self {
    case .timer: return .timer
    case .relative: return .relative
    case .offset: return .offset
    case .date: return .date
    case .time: return .time
    }
  }
}

public final class TextViewProps: UIBaseViewProps {
  @Field public var text: String = ""
  @Field public var markdownEnabled: Bool = false
  @Field public var date: Date?
  @Field public var dateStyle: TextDateStyle?
  @Field public var timerInterval: ClosedRangeDate?
  @Field public var countsDown: Bool?
  @Field public var pauseTime: Date?

  // Override default frame alignment for text views
  override var defaultFrameAlignment: Alignment { .leading }
}

public struct TextView: ExpoSwiftUI.View {
  @ObservedObject public var props: TextViewProps

  public init(props: TextViewProps) {
    self.props = props
  }

  public var body: some View {
    content
      .applyModifiers(props.modifiers, appContext: props.appContext, globalEventDispatcher: props.globalEventDispatcher)
  }

  // Text(timerInterval:) has no finite ideal width, so fixedSize needs a hidden placeholder with its widest value.
  @ViewBuilder
  private var content: some View {
    if let placeholder = timerPlaceholder {
      Text(placeholder)
        .hidden()
        .overlay(alignment: .leading) { buildText(applyModifiers: false) }
    } else {
      buildText(applyModifiers: false)
    }
  }

  private var timerPlaceholder: String? {
    guard #available(iOS 16.0, tvOS 16.0, *),
      let lower = props.timerInterval?.lower,
      let upper = props.timerInterval?.upper,
      lower <= upper,
      fixesHorizontalSize,
      props.children?.contains(where: { $0.childView is TextView }) != true
    else {
      return nil
    }
    let seconds = Int(upper.timeIntervalSince(lower).rounded(.up))
    if seconds < 600 {
      return "0:00"
    }
    if seconds < 3600 {
      return "00:00"
    }
    return String(repeating: "0", count: String(seconds / 3600).count) + ":00:00"
  }

  private var fixesHorizontalSize: Bool {
    props.modifiers?.contains { modifier in
      guard modifier["$type"] as? String == "fixedSize" else {
        return false
      }
      return modifier["horizontal"] as? Bool ?? (modifier["vertical"] as? Bool == nil)
    } ?? false
  }

  internal func buildText(applyModifiers: Bool = true) -> Text {
    let text: Text

    if #available(iOS 16.0, tvOS 16.0, *),
       let timerInterval = props.timerInterval,
       let lower = timerInterval.lower,
       let upper = timerInterval.upper,
       lower <= upper {
      text = Text(
        timerInterval: ClosedRange(uncheckedBounds: (lower: lower, upper: upper)),
        pauseTime: props.pauseTime,
        countsDown: props.countsDown ?? true
      )
    } else if let date = props.date {
      text = Text(date, style: props.dateStyle?.toSwiftUI() ?? .date)
    } else {
      text = props.markdownEnabled ? Text(LocalizedStringKey(props.text)) : Text(props.text)
    }

    var result = applyModifiers
    ? text.applyTextModifiers(props.modifiers, appContext: props.appContext)
    : text

    if let children = props.children {
      result = children
        .compactMap { ($0.childView as? TextView)?.buildText(applyModifiers: true) }
        .reduce(result, +)
    }
    return result
  }
}
