import SwiftUI

struct DevMenuRNDevMenu: View {
  let onOpenRNDevMenu: () -> Void

  var body: some View {
    Button {
      onOpenRNDevMenu()
    } label: {
      HStack {
        Text("Open React Native dev menu")
          .foregroundColor(.primary)
        Spacer()
      }
      .padding()
    }
#if !os(tvOS)
    .background(Color(.secondarySystemBackground))
#endif
    .cornerRadius(18)
  }
}

#Preview {
  DevMenuRNDevMenu {}
}
