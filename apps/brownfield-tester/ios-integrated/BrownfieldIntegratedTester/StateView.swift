import Combine
import SwiftUI
import expoappbrownfield

struct StateView: View {
    @SharedState("time-js", initialValue: "") var time: String?
    @SharedState("counter", initialValue: 0) var counter: Int?
    
    var body: some View {
        VStack {
            Text(time ?? "")
            Button(action: {
                BrownfieldState.delete("time-js")
            }) {
                Text("Delete js-time state entry")
            }
            .accessibilityIdentifier("js-time-delete")
            
            Text("\(counter ?? 0)")
            HStack {
                Button(action: {
                    counter = (counter ?? 0) + 1
                }) {
                    Image(systemName: "plus")
                }
                Button(action: {
                    counter = (counter ?? 0) - 1
                }) {
                    Image(systemName: "minus")
                }
            }
        }
    }
}
