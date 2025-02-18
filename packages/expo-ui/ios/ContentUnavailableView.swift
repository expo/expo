  // Copyright 2025-present 650 Industries. All rights reserved.

  import ExpoModulesCore
  import SwiftUI

  class ContentUnavailableProps: ExpoSwiftUI.ViewProps {
    @Field var title: String?
    @Field var systemImage: String?
    @Field var description: String?
  }

  struct ExpoContentUnavailableView: ExpoSwiftUI.View {
    @EnvironmentObject var props: ContentUnavailableProps

    var body: some View {
      if #available(iOS 17.0, *) {
        ContentUnavailableView(props.title ?? "", systemImage: props.systemImage ?? "questionmark.square", description: Text(props.description ?? ""))
      } else {
        VStack(spacing: 10) {
          Image(systemName: props.systemImage ?? "questionmark.square")
                  .font(.system(size: 50))
                  .foregroundColor(.gray)

          Text(props.title ?? "")
                  .font(.title2)
                  .fontWeight(.semibold)
                  .multilineTextAlignment(.center)

          Text(props.description ?? "")
                  .font(.body)
                  .multilineTextAlignment(.center)
                  .padding(.horizontal, 20)
        }
        .padding()
      }
    }
  }