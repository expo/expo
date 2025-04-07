import ExpoModulesCore
import SwiftUI

class DateTimePickerProps: ExpoSwiftUI.ViewProps {
  @Field var title: String = "Select Date"
  @Field var initialDate: Date?
  @Field var variant: PickerStyle = .automatic
  @Field var displayedComponents: DisplayedComponents = .date
  @Field var color: Color?
  var onDateSelected = EventDispatcher()
}

struct DateTimePickerView: ExpoSwiftUI.View, ExpoSwiftUI.WithHostingView {
  @ObservedObject var props: DateTimePickerProps
  @EnvironmentObject var shadowNodeProxy: ExpoSwiftUI.ShadowNodeProxy
  @State private var date = Date()

  init(props: DateTimePickerProps) {
    self.props = props
  }

  var body: some View {
    #if os(tvOS)
    return Text("DateTimePicker is not supported on tvOS")
    #else
    let displayedComponents = props.displayedComponents.toDatePickerComponent()

    ExpoSwiftUI.AutoSizingStack(shadowNodeProxy: shadowNodeProxy, axis: .vertical) {
      DatePicker(props.title, selection: $date, displayedComponents: displayedComponents)
        .onAppear {
          date = props.initialDate ?? Date()
        }
        .onChange(of: date, perform: { newDate in
          props.onDateSelected(["date": newDate.timeIntervalSince1970 * 1000])
        })
        .applyDatePickerStyle(for: props.variant)
        .tint(props.color)
        .foregroundStyle(props.color ?? .accentColor)
    }
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
