import ExpoModulesCore
import SwiftUI
import ContactsUI

class AccessButtonProps: ExpoSwiftUI.ViewProps {
  @Field var queryString: String = ""
  @Field var padding: CGFloat = 0
}

struct ExpoContactsAccessButton: ExpoSwiftUI.View {
  @EnvironmentObject var props: AccessButtonProps
  @State var isPresented: Bool = false
  
  var body: some View {
    if #available(iOS 18.0, *) {
      ContactAccessButton(queryString: props.queryString)
        .frame(minHeight: 100)
    } else {
      EmptyView()
    }
  }
}

#Preview {
  ExpoContactsAccessButton()
}
