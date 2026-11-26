import ExpoModulesCore
import SwiftUI

internal struct DatePickerView: ExpoSwiftUI.View {
  @ObservedObject var props: DatePickerProps
  @State private var date = Date()

  private var isGraphicalStyle: Bool {
    props.modifiers?.contains {
      $0["$type"] as? String == "datePickerStyle" && $0["style"] as? String == "graphical"
    } ?? false
  }

  var body: some View {
#if os(tvOS)
    Text("DatePicker is not supported on tvOS")
#else
    datePicker
      .onChange(of: date) { newDate in
        if props.selection == newDate { return }
        props.onDateChange(["date": newDate.timeIntervalSince1970 * 1000])
      }
      .onChange(of: props.selection) { newValue in
        date = newValue ?? Date()
      }
      .onAppear {
        date = props.selection ?? Date()
      }
#endif
  }

#if !os(tvOS)
  @ViewBuilder
  private var datePicker: some View {
#if os(iOS)
    if isGraphicalStyle {
      graphicalDatePicker
    } else {
      swiftUIDatePicker
    }
#else
    swiftUIDatePicker
#endif
  }

  private var swiftUIDatePicker: some View {
    createDatePicker()
      // Graphical style on macOS: https://github.com/expo/expo/issues/47062
      .frame(minWidth: isGraphicalStyle ? 320 : nil)
      .if(props.title == nil && !hasChildren) { $0.labelsHidden() }
  }

#if os(iOS)
  // SwiftUI's graphical `DatePicker` can keep a wrong height when it appears after launch.
  // https://github.com/expo/expo/issues/47765
  @ViewBuilder
  private var graphicalDatePicker: some View {
    let picker = InlineDatePicker(
      date: $date,
      range: props.range,
      components: props.displayedComponents,
      accessibilityLabel: props.title
    )
    // Like SwiftUI's graphical style, the label is not drawn and is only read by VoiceOver.
    if hasChildren, #available(iOS 18.0, *) {
      picker.accessibilityLabel { _ in Children() }
    } else {
      picker
    }
  }
#endif
#endif

  private var hasChildren: Bool {
    props.children?.isEmpty == false
  }

#if !os(tvOS)
  @ViewBuilder
  private func createDatePicker() -> some View {
    let components = props.displayedComponents.toSwiftUIComponents()
    let start = props.range?.start
    let end = props.range?.end

    // Use children as custom label
    if hasChildren {
      if let start, let end {
        DatePicker(selection: $date, in: start...end, displayedComponents: components) {
          Children()
        }
      } else if let start {
        DatePicker(selection: $date, in: start..., displayedComponents: components) {
          Children()
        }
      } else if let end {
        DatePicker(selection: $date, in: ...end, displayedComponents: components) {
          Children()
        }
      } else {
        DatePicker(selection: $date, displayedComponents: components) {
          Children()
        }
      }
    }
    // Use title string
    else {
      let title = props.title ?? ""
      if let start, let end {
        DatePicker(title, selection: $date, in: start...end, displayedComponents: components)
      } else if let start {
        DatePicker(title, selection: $date, in: start..., displayedComponents: components)
      } else if let end {
        DatePicker(title, selection: $date, in: ...end, displayedComponents: components)
      } else {
        DatePicker(title, selection: $date, displayedComponents: components)
      }
    }
  }
#endif
}

internal struct DateRange: Record {
  @Field var start: Date?
  @Field var end: Date?
}

internal enum DatePickerComponent: String, Enumerable {
  case date
  case hourAndMinute
}

#if os(iOS)
private struct InlineDatePicker: UIViewRepresentable {
  @Binding var date: Date
  let range: DateRange?
  let components: [DatePickerComponent]
  let accessibilityLabel: String?

  func makeCoordinator() -> Coordinator {
    Coordinator(date: $date)
  }

  func makeUIView(context: Context) -> UIDatePicker {
    let picker = UIDatePicker()
    picker.preferredDatePickerStyle = .inline
    picker.addTarget(context.coordinator, action: #selector(Coordinator.valueChanged(_:)), for: .valueChanged)
    return picker
  }

  func updateUIView(_ picker: UIDatePicker, context: Context) {
    context.coordinator.date = $date
    let environment = context.environment
    let mode = components.toDatePickerMode()

    // These change the picker's content, so SwiftUI has to measure it again.
    var needsMeasure = false
    if picker.datePickerMode != mode {
      picker.datePickerMode = mode
      needsMeasure = true
    }
    if picker.locale != environment.locale {
      picker.locale = environment.locale
      needsMeasure = true
    }
    if picker.calendar != environment.calendar {
      picker.calendar = environment.calendar
      needsMeasure = true
    }
    if picker.timeZone != environment.timeZone {
      picker.timeZone = environment.timeZone
    }
    picker.minimumDate = range?.start
    picker.maximumDate = range?.end
    if picker.date != date {
      picker.setDate(date, animated: false)
    }
    picker.isEnabled = environment.isEnabled
    picker.accessibilityLabel = accessibilityLabel

    if needsMeasure {
      picker.invalidateIntrinsicContentSize()
    }
  }

  func sizeThatFits(_ proposal: ProposedViewSize, uiView: UIDatePicker, context: Context) -> CGSize? {
    let width = proposal.width.flatMap { $0.isFinite ? $0 : nil }
    let size = uiView.systemLayoutSizeFitting(
      CGSize(width: width ?? 0, height: UIView.layoutFittingCompressedSize.height),
      withHorizontalFittingPriority: width == nil ? .fittingSizeLevel : .required,
      verticalFittingPriority: .fittingSizeLevel
    )
    return CGSize(width: width ?? size.width, height: size.height)
  }

  final class Coordinator: NSObject {
    var date: Binding<Date>

    init(date: Binding<Date>) {
      self.date = date
    }

    @objc func valueChanged(_ picker: UIDatePicker) {
      date.wrappedValue = picker.date
    }
  }
}

private extension [DatePickerComponent] {
  func toDatePickerMode() -> UIDatePicker.Mode {
    switch (contains(.date), contains(.hourAndMinute)) {
    case (true, true):
      return .dateAndTime
    case (false, true):
      return .time
    default:
      return .date
    }
  }
}
#endif

#if !os(tvOS)
internal extension [DatePickerComponent] {
  func toSwiftUIComponents() -> DatePicker.Components {
    var components: DatePicker.Components = []
    for component in self {
      switch component {
      case .date:
        components.insert(.date)
      case .hourAndMinute:
        components.insert(.hourAndMinute)
      }
    }
    return components
  }
}
#endif

internal final class DatePickerProps: UIBaseViewProps {
  @Field var title: String?
  @Field var selection: Date?
  @Field var range: DateRange?
  @Field var displayedComponents: [DatePickerComponent] = [.date]
  var onDateChange = EventDispatcher()
}
