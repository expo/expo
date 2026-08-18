import SwiftUI
import ExpoModulesCore
import ExpoUI

final class FragmentProps: ExpoUI.ButtonProps {}

struct FragmentView: ExpoSwiftUI.View {
  @ObservedObject var props: FragmentProps

  var body: some View {
    Children()
  }
}
