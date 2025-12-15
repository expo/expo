// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct DevServerInfoModal: View {
  @Binding var showingInfoDialog: Bool

  var body: some View {
    Group {
      if #available(iOS 15.0, tvOS 16.0, *) {
        if showingInfoDialog {
          Color.black.opacity(0.4)
            .ignoresSafeArea(.all)
            .onTapGesture {
              showingInfoDialog = false
            }
          content
        }
      }
    }
    .animation(.easeInOut(duration: 0.3), value: showingInfoDialog)
  }

  private var content: some View {
    VStack(spacing: 16) {
      header
      Divider()
      info
    }
    .padding(20)
    .background(Color.expoSystemBackground)
    .clipShape(RoundedRectangle(cornerRadius: 16))
    .shadow(color: .black.opacity(0.1), radius: 10, x: 0, y: 5)
    .padding(.horizontal, 40)
  }

  private var header: some View {
    HStack {
      Text("Development Servers")
        .font(.headline)
        .fontWeight(.semibold)
      Spacer()
      Button {
        showingInfoDialog = false
      } label: {
        Image(systemName: "xmark")
          .font(.title3)
          .foregroundColor(.secondary)
      }
    }
  }

  private var info: some View {
    VStack(alignment: .leading, spacing: 12) {
      Text("Start a local development server with:")
        .font(.subheadline)

      Text("**npx expo start**")
        .frame(maxWidth: .infinity, alignment: .leading)
        .font(.system(.callout, design: .monospaced))
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color.expoSystemGray6)
        .clipShape(RoundedRectangle(cornerRadius: 6))
        .overlay(
          RoundedRectangle(cornerRadius: 6)
            .stroke(Color.expoSystemGray4, lineWidth: 1)
        )

      Text("Then, select the local server when it appears here.")
        .font(.subheadline)

      Text("Alternatively, open the Camera app and scan the QR code that appears in your terminal.")
        .font(.subheadline)
        .foregroundColor(.secondary)
    }
  }
}
