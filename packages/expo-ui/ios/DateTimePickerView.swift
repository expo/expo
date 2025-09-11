import ExpoModulesCore
import SwiftUI

final class DateTimePickerProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?

  @Field var title: String?
  @Field var initialDate: Date?
  @Field var variant: PickerStyle = .automatic
  @Field var displayedComponents: DisplayedComponents = .date
  @Field var color: Color?
  var onDateSelected = EventDispatcher()
}

struct DateTimePickerView: ExpoSwiftUI.View {
  @ObservedObject var props: DateTimePickerProps
  @State private var date = Date()

  init(props: DateTimePickerProps) {
    self.props = props
  }

  var body: some View {
    #if os(tvOS)
    return Text("DateTimePicker is not supported on tvOS")
    #else
    let displayedComponents = props.displayedComponents.toDatePickerComponent()

    DatePicker(props.title ?? "", selection: $date, displayedComponents: displayedComponents)
      .modifier(CommonViewModifiers(props: props))
      .onAppear {
        date = props.initialDate ?? Date()
      }
      .onChange(of: date, perform: { newDate in
        props.onDateSelected(["date": newDate.timeIntervalSince1970 * 1000])
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
