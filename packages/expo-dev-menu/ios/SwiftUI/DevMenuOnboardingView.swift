import SwiftUI

struct DevMenuOnboardingView: View {
  let onFinish: () -> Void
  var appName: String = "development builds"
  @State private var isVisible = true

  var body: some View {
    Rectangle()
      .fill(.ultraThinMaterial)
      .ignoresSafeArea()
      .overlay(OnboardingOverlay(onFinish: onFinish, isVisible: $isVisible))
      .offset(x: 0, y: isVisible ? 0.0 : 650.0)
      .animation(.easeInOut(duration: 0.5), value: isVisible)
  }
}

private struct OnboardingOverlay: View {
  let onFinish: () -> Void
  @Binding var isVisible: Bool
  var appName = "development builds"
  
  var body: some View {
    ScrollView {
      VStack(spacing: 16) {
        Image("dev-tools", bundle: getDevMenuBundle())
          .resizable()
          .scaledToFit()
          .frame(height: 80)
          .frame(maxWidth: .infinity)
          .padding(.vertical, 20)
          .background(Color.black)
          .cornerRadius(12)

        VStack(spacing: 12) {
          Text("This is the tools menu. Inside of this menu, you can reload your project, go back home, and access other useful utilities.")
            .frame(maxWidth: .infinity, alignment: .leading)
            .font(.callout)

#if targetEnvironment(simulator)
          VStack(spacing: 4) {
            Text("You can open it at any time by pressing the blue button with the gear icon, or with the **⌃ + d** keyboard shortcut.")
              .frame(maxWidth: .infinity, alignment: .leading)
              .font(.callout)

            Text("(Connect Hardware Keyboard must be enabled on your simulator to use this shortcut, you can toggle it with **⌘ + shift + K**.)")
              .foregroundColor(.secondary)
              .frame(maxWidth: .infinity, alignment: .leading)
              .font(.footnote)
          }
#else
          Text("You can shake your device or long press anywhere on the screen with three fingers to get back to it at any time.")
            .foregroundColor(.primary)
            .frame(maxWidth: .infinity, alignment: .leading)
#endif
        }

        ContinueButton(onFinish: onFinish, isVisible: $isVisible)
      }
      .padding()
    }
  }
}

private struct ContinueButton: View {
  let onFinish: () -> Void
  @Binding var isVisible: Bool
  
  var body: some View {
    Button {
      withAnimation(.easeInOut(duration: 0.3)) {
        isVisible = false
      }
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
        onFinish()
      }
    }
    label: {
      Text("Continue")
        .font(.system(size: 16, weight: .semibold))
        .frame(maxWidth: .infinity)
        .frame(height: 32)
    }
    .buttonStyle(.borderedProminent)
  }
}
