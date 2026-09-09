// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

public enum TextDateStyle: String, Enumerable {
  case timer, relative, offset, date, time, components

  func toSwiftUI() -> SwiftUI.Text.DateStyle {
    switch self {
    case .timer: return .timer
    case .relative, .components: return .relative
    case .offset: return .offset
    case .date: return .date
    case .time: return .time
    }
  }
}

public enum TextComponentsStyle: String, Enumerable {
  case spellOut, wide, abbreviated, condensedAbbreviated, narrow

  func toSwiftUI() -> Date.ComponentsFormatStyle.Style {
    switch self {
    case .spellOut: return .spellOut
    case .wide: return .wide
    case .abbreviated: return .abbreviated
    case .condensedAbbreviated: return .condensedAbbreviated
    case .narrow: return .narrow
    }
  }
}

public enum TextComponentsField: String, Enumerable {
  case year, month, week, day, hour, minute, second

  func toSwiftUI() -> Date.ComponentsFormatStyle.Field {
    switch self {
    case .year: return .year
    case .month: return .month
    case .week: return .week
    case .day: return .day
    case .hour: return .hour
    case .minute: return .minute
    case .second: return .second
    }
  }
}

public final class TextViewProps: UIBaseViewProps {
  @Field public var text: String = ""
  @Field public var markdownEnabled: Bool = false
  @Field public var date: Date?
  @Field public var dateStyle: TextDateStyle?
  @Field public var componentsStyle: TextComponentsStyle?
  @Field public var componentsFields: [TextComponentsField]?
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
    buildText(applyModifiers: false)
      .applyModifiers(props.modifiers, appContext: props.appContext, globalEventDispatcher: props.globalEventDispatcher)
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
    } else if #available(iOS 18.0, tvOS 18.0, *), let date = props.date, props.dateStyle == .components {
      let range: TimeDataSource<Range<Date>> = props.countsDown ?? true
        ? .dateRange(endingAt: date)
        : .dateRange(startingAt: date)
      text = Text(
        range,
        format: .components(
          style: props.componentsStyle?.toSwiftUI() ?? .abbreviated,
          fields: props.componentsFields.map { Set($0.map { $0.toSwiftUI() }) }
        )
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
