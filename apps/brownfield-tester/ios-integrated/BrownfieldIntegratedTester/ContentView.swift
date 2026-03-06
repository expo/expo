import Combine
import SwiftUI
import expoappbrownfield

struct ContentView: View {
    @StateObject private var brownfieldTester = BrownfieldTester()
    
    var body: some View {
        NavigationStack {
            List {
                Section(header: Text("Screens")) {
                    NavigationLink(destination: ReactNativeView(), label: {
                        HStack {
                            Image(systemName: "atom")
                            Text("Open React Native App")
                                .accessibilityIdentifier("openReactNativeButton")
                        }
                    })
                }
                
                Section(header: Text("Custom component")) {
                    ReactNativeView(moduleName: "custom-component")
                        .frame(height: 400)
                }
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
