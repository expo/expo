import ExpoModulesCore
import SwiftUI

final class DateTimePickerProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?

  @Field var title: String?
  @Field var date: Date?
  @Field var variant: PickerStyle = .automatic
  @Field var displayedComponents: DisplayedComponents = .date
  @Field var color: Color?
  @Field var range: DateRange?
  var onDateSelected = EventDispatcher()
}

struct DateTimePickerView: ExpoSwiftUI.View {
  @ObservedObject var props: DateTimePickerProps
  @State private var date = Date()

  init(props: DateTimePickerProps) {
    self.props = props
  }

  #if !os(tvOS)
  @ViewBuilder
  private func makeDatePicker() -> some View {
    let title = props.title ?? ""
    let components = props.displayedComponents.toDatePickerComponent()

    if let range = props.range {
      switch (range.lowerBound, range.upperBound) {
      case let (lower?, upper?):
        DatePicker(title, selection: $date, in: lower...upper, displayedComponents: components)
      case let (lower?, nil):
        DatePicker(title, selection: $date, in: lower..., displayedComponents: components)
      case let (nil, upper?):
        DatePicker(title, selection: $date, in: ...upper, displayedComponents: components)
      case (nil, nil):
        DatePicker(title, selection: $date, displayedComponents: components)
      }
    } else {
      DatePicker(title, selection: $date, displayedComponents: components)
    }
  }
  #endif

  var body: some View {
    #if os(tvOS)
    return Text("DateTimePicker is not supported on tvOS")
    #else
    makeDatePicker()
      .modifier(CommonViewModifiers(props: props))
      .onAppear {
        date = props.date ?? Date()
      }
      .onChange(of: date, perform: { newDate in
        if props.date == newDate {
          return
        }

        props.onDateSelected(["date": newDate.timeIntervalSince1970 * 1000])
      })
      .onReceive(props.date.publisher, perform: { newDate in
        date = newDate
      })
      .if(props.title == nil, { $0.labelsHidden() })
      .applyDatePickerStyle(for: props.variant)
      .tint(props.color)
      .foregroundStyle(props.color ?? .accentColor)
    #endif
  }
}

#if !os(tvOS)
private extension View {
  @ViewBuilder
  func applyDatePickerStyle(for style: PickerStyle) -> some View {
    switch style {
    case .wheel:
      self.datePickerStyle(.wheel)
    case .graphical:
      self.datePickerStyle(.graphical)
    case .compact:
      self.datePickerStyle(.compact)
    case .automatic:
      self.datePickerStyle(.automatic)
    }
  }
}
#endif

enum PickerStyle: String, Enumerable {
  case wheel
  case graphical
  case compact
  case automatic
}

enum DisplayedComponents: String, Enumerable {
  case date
  case hourAndMinute
  case dateAndTime
  #if !os(tvOS)
  func toDatePickerComponent() -> DatePicker.Components {
    switch self {
    case .date:
      return [.date]
    case .hourAndMinute:
      return [.hourAndMinute]
    case .dateAndTime:
      return [.date, .hourAndMinute]
    }
  }
  #endif
}

internal struct DateRange: Record {
  @Field var lowerBound: Date?
  @Field var upperBound: Date?
}
