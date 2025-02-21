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

struct DateTimePickerView: ExpoSwiftUI.View {
  @EnvironmentObject var props: DateTimePickerProps
  @EnvironmentObject var shadowNodeProxy: ExpoSwiftUI.ShadowNodeProxy
  @State private var date = Date()

  var body: some View {
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
  }
}

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
}
