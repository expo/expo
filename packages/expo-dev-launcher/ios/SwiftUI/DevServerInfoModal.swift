// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct DevServerInfoModal: View {
  @Environment(\.dismiss) private var dismiss

  var body: some View {
    VStack(alignment: .leading, spacing: 16) {
      header
      info
      Spacer()
    }
    .padding(20)
    .frame(maxWidth: .infinity, alignment: .leading)
    #if os(iOS)
    .presentationDetents([.medium])
    #endif
  }

  private var header: some View {
    HStack {
      Text("Development Servers")
        .font(.title2)
        .fontWeight(.bold)
      Spacer()
      Button {
        dismiss()
      } label: {
        Image(systemName: "xmark.circle.fill")
          .font(.title2)
          .foregroundColor(.secondary)
      }
      .buttonStyle(.plain)
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
