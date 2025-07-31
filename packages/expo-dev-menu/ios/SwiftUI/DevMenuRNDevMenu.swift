import SwiftUI

struct DevMenuRNDevMenu: View {
  let onOpenRNDevMenu: () -> Void

  var body: some View {
    Button { onOpenRNDevMenu() }
    label: {
      HStack {
        Text("Open React Native dev menu")
          .foregroundColor(.primary)
        Spacer()
      }
      .padding()
    }
    #if !os(tvOS)
    .background(Color(.systemBackground))
    #endif
    .cornerRadius(12)
    .padding(.horizontal)
    .padding(.vertical, 8)
  }
}

#Preview {
  DevMenuRNDevMenu {}
}
