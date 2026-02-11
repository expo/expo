import SwiftUI
import minimaltesterbrownfield

struct ContentView: View {
    var body: some View {
        VStack {
            Image(systemName: "globe")
                .imageScale(.large)
                .foregroundStyle(.tint)
            Text("Hello, world!")
            ReactNativeView(moduleName: "main")
        }
        .padding()
    }
}

#Preview {
    ContentView()
}
