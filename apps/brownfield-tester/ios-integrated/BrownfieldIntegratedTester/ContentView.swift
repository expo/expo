import Combine
import SwiftUI
import expoappbrownfield

struct ContentView: View {
    @StateObject private var brownfieldTester = BrownfieldTester()
    
    var body: some View {
        NavigationStack {
            List {
                NavigationLink(destination: ReactNativeView(moduleName: "main"), label: {
                    HStack {
                        Image(systemName: "atom")
                        Text("React Native App")
                    }
                    .accessibilityIdentifier("openReactNativeButton")
                })
                NavigationLink(destination: StateView(), label: {
                    HStack {
                        Image(systemName: "cylinder.split.1x2")
                        Text("Shared State")
                    }
                    .accessibilityIdentifier("openStateView")
                })
            }
            .listStyle(.sidebar)
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
