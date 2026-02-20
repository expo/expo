import Combine
import SwiftUI
import expoappbrownfield

struct StateView: View {
    @State var jsTimeSubscription: AnyCancellable?
    @State private var time: String = ""
    
    var body: some View {
        VStack {
            Text(time)
            Button(action: {
                BrownfieldState.delete("time-js")
            }) {
                Text("Delete js-time state entry")
            }
            .accessibilityIdentifier("js-time-delete")
        }
        .onAppear {
            jsTimeSubscription = BrownfieldState.subscribe("time-js", as: String.self) { jsTime in
                time = jsTime
            }
        }
        .onDisappear { jsTimeSubscription?.cancel() }
    }
}
