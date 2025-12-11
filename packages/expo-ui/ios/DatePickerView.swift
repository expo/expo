import ExpoModulesCore
import SwiftUI

internal struct DatePickerView: ExpoSwiftUI.View {
  @ObservedObject var props: DatePickerProps
  @State private var date = Date()

  var body: some View {
    #if os(tvOS)
    Text("DatePicker is not supported on tvOS")
    #else
    createDatePicker()
      .onAppear {
        date = props.selection ?? Date()
      }
      .onChange(of: date) { newDate in
        props.onDateChange(["date": newDate.timeIntervalSince1970 * 1000])
      }
      .if(props.title == nil && !hasChildren) { $0.labelsHidden() }
    #endif
  }

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
