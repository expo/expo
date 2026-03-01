import Combine
import SwiftUI
import expoappbrownfield

struct ContentView: View {
    @StateObject private var brownfieldTester = BrownfieldTester()
    
    var body: some View {
        NavigationStack {
            NavigationLink(destination: ReactNativeView(moduleName: "main"), label: {
                Text("Open React Native App")
                    .accessibilityIdentifier("openReactNativeButton")
                    .font(.largeTitle)
            })
        }
        .onAppear { brownfieldTester.start() }
        .onDisappear { brownfieldTester.stop() }
        .alert("Message from Native", isPresented: $brownfieldTester.showAlert) {
            Button("OK", role: .cancel) { }
        } message: {
            Text(brownfieldTester.alertMessage)
        }
    }
}

#Preview {
    ContentView()
}
