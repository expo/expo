import SwiftUI

struct ContentView: View {
    @State private var showingExpoScreen = false

    var body: some View {
        NavigationStack {
            VStack {
                Image(systemName: "atom")
                    .imageScale(.large)
                    .foregroundStyle(.tint)
                Button("Open Expo") {
                    showingExpoScreen = true
                }
                .navigationDestination(isPresented: $showingExpoScreen) {
                    ExpoScreen()
                }
            }
            .navigationTitle("Brownfield Tester")
        }
    }
}

struct ExpoScreen: View {
    var body: some View {
        VStack {
            ExpoView(moduleName: "main", initialProperties: [:])
        }
        .navigationTitle("Expo")
    }
}

#Preview {
    ContentView()
}
