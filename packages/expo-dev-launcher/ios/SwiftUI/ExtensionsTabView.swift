// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

func getDevLauncherBundle() -> Bundle? {
  if let bundleURL = Bundle.main.url(forResource: "EXDevLauncher", withExtension: "bundle") {
    if let bundle = Bundle(url: bundleURL) {
      return bundle
    }
  }

  // fallback to the main bundle
  return .main
}

struct ExtensionsTabView: View {
  var body: some View {
    VStack(spacing: 0) {
      DevLauncherNavigationHeader()
      List {
        Section {
          VStack(spacing: 16) {
            Image("extensions", bundle: getDevLauncherBundle())
              .resizable()
              .aspectRatio(contentMode: .fit)
              .frame(width: 44, height: 44)

            description
            learnMore
          }
        }
        .cornerRadius(5)
      }
    }
    .background(Color(.systemGroupedBackground))
  }

  private var description: some View {
    VStack {
      Text("Extensions allow you to customize your development build with additional capabilities.")
        .font(.system(size: 12))
        .multilineTextAlignment(.center)
        .foregroundStyle(.gray)

      if let destination = URL(string: "https://docs.expo.dev/development/extensions/") {
        Link("Learn more", destination: destination)
          .font(.system(size: 12))
      }
    }
  }

  private var learnMore: some View {
    VStack {
      Text("If you would like to extend the display on this screen, let us know about your use case")
        .multilineTextAlignment(.center)
        .foregroundStyle(.gray)

      if let destination = URL(string: "https://expo.canny.io/feature-requests") {
        Link("Let us know about your use case", destination: destination)
      }
    }
    .font(.system(size: 12))
  }
}

#Preview {
  ExtensionsTabView()
}
