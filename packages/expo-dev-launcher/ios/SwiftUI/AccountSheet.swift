// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
#if os(tvOS)
import CoreImage.CIFilterBuiltins
#endif

struct AccountSheet: View {
  @Environment(\.dismiss) private var dismiss
  @EnvironmentObject var viewModel: DevLauncherViewModel
  @State private var showingLogoutConfirmation = false

  var body: some View {
    NavigationStack {
      content
        .navigationTitle("Account")
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
        .toolbar {
          ToolbarItem(placement: .cancellationAction) {
            Button {
              dismiss()
            } label: {
              Image(systemName: "xmark")
            }
            .accessibilityLabel("Close")
          }
          .verticalBarPreferred()
        }
    }
    .presentationDetents(viewModel.isAuthenticated ? [.medium, .large] : [.large])
  }

  private var content: some View {
    VStack(spacing: 0) {
      if !viewModel.isAuthenticated {
        Spacer()
        Image("expo-go-logo", bundle: getDevLauncherBundle())
          .resizable()
          .scaledToFit()
          .frame(width: 180)
        Spacer()
      }

      VStack(spacing: 0) {
        if viewModel.isAuthenticated {
          userAccountSelector
        } else {
          loginSignupCard
        }
      }
      .padding(.horizontal, 20)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    #if !os(tvOS) && !os(macOS)
    .background(Color(.systemGroupedBackground))
    #endif
    #if os(tvOS)
    .onDisappear {
      viewModel.cancelDeviceLogin()
    }
    #endif
  }

  private var userAccountSelector: some View {
    VStack(spacing: 0) {
      ScrollView {
        VStack(spacing: 16) {
          if let userData = viewModel.user, !userData.accounts.isEmpty {
            VStack(spacing: 0) {
              ForEach(Array(userData.accounts.enumerated()), id: \.element.id) { index, account in
                accountRow(account: account)
                if index < userData.accounts.count - 1 {
                  Divider()
                }
              }
            }
            .clipShape(RoundedRectangle(cornerRadius: 12))
          }
        }
      }

      logOutButton
    }
  }

  private var logOutButton: some View {
    Button(role: .destructive) {
      showingLogoutConfirmation = true
    }
    label: {
      Text("Log out")
        .font(.headline)
        .foregroundStyle(Color.red)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
    }
    .background(Color.expoSecondarySystemBackground)
    .clipShape(RoundedRectangle(cornerRadius: 12))
    .confirmationDialog(
      "Are you sure you want to log out?",
      isPresented: $showingLogoutConfirmation,
      titleVisibility: .visible
    ) {
      Button("Log out", role: .destructive) {
        viewModel.signOut()
      }
      Button("Cancel", role: .cancel) {}
    }
  }

  private var loginSignupCard: some View {
    VStack(spacing: 16) {
      Text("Log in or create an account to view local development servers and more.")
        .font(.system(size: 14))
        .foregroundStyle(Color.secondary)

      #if os(tvOS)
      deviceLoginCard
      #else
      VStack(spacing: 8) {
        signInButton
        signUpButton
      }
      #endif
    }
  }

  private var signInButton: some View {
    Button {
      Task {
        await viewModel.signIn()
      }
    }
    label: {
      HStack(spacing: 8) {
        if viewModel.isAuthenticating {
          ProgressView()
            .tint(.white)
            .scaleEffect(0.8)
            .transition(.scale.combined(with: .opacity))
        }

        Text("Log in")
          .font(.headline)
          .fontWeight(.semibold)
      }
      .foregroundStyle(Color.expoSystemBackground)
      .frame(maxWidth: .infinity)
      .padding(.vertical, 12)
      .animation(.easeInOut(duration: 0.2), value: viewModel.isAuthenticating)
    }
    .background(Color.primary)
    .clipShape(RoundedRectangle(cornerRadius: 12))
    .disabled(viewModel.isAuthenticating)
  }

  #if os(tvOS)
  @ViewBuilder
  private var deviceLoginCard: some View {
    switch viewModel.deviceLoginStep {
    case nil:
      VStack(spacing: 8) {
        signInButton
        Text("You will approve the login on your phone or computer.")
          .font(.caption)
          .foregroundStyle(Color.secondary)
      }
    case .waitingForApproval(let userCode, let verificationURL):
      HStack(alignment: .center, spacing: 40) {
        if let qrCode = qrCodeImage(for: verificationURL) {
          Image(uiImage: qrCode)
            .interpolation(.none)
            .resizable()
            .frame(width: 240, height: 240)
        }
        VStack(alignment: .leading, spacing: 12) {
          Text("Scan the QR code, or go to")
            .foregroundStyle(Color.secondary)
          Text(verificationURL.host.map { "\($0)\(verificationURL.path)" } ?? verificationURL.absoluteString)
            .font(.headline)
          Text("and enter this code:")
            .foregroundStyle(Color.secondary)
          Text(userCode)
            .font(.system(size: 56, weight: .bold, design: .monospaced))
          HStack(spacing: 12) {
            ProgressView()
            Text("Waiting for approval…")
              .foregroundStyle(Color.secondary)
          }
        }
      }
      cancelDeviceLoginButton
    case .matching(let options):
      VStack(spacing: 24) {
        Text("Select the number shown in your browser")
          .font(.headline)
        HStack(spacing: 24) {
          ForEach(options, id: \.self) { option in
            Button {
              viewModel.selectDeviceLoginMatch(option)
            } label: {
              Text(option)
                .font(.system(size: 40, weight: .bold, design: .monospaced))
                .frame(minWidth: 120)
            }
          }
        }
        cancelDeviceLoginButton
      }
    case .verifying:
      HStack(spacing: 12) {
        ProgressView()
        Text("Logging in…")
      }
    case .failed(let message):
      VStack(spacing: 16) {
        Text(message)
          .foregroundStyle(Color.red)
        Button("Try again") {
          viewModel.startDeviceLogin()
        }
      }
    }
  }

  private var cancelDeviceLoginButton: some View {
    Button("Cancel") {
      viewModel.cancelDeviceLogin()
    }
  }

  private func qrCodeImage(for url: URL) -> UIImage? {
    let filter = CIFilter.qrCodeGenerator()
    filter.message = Data(url.absoluteString.utf8)
    filter.correctionLevel = "M"
    guard let output = filter.outputImage?.transformed(by: CGAffineTransform(scaleX: 10, y: 10)),
      let cgImage = CIContext().createCGImage(output, from: output.extent) else {
      return nil
    }
    return UIImage(cgImage: cgImage)
  }
  #endif

  private var signUpButton: some View {
    Button {
      Task {
        await viewModel.signUp()
      }
    }
    label: {
      Text("Sign up")
        .font(.headline)
        .fontWeight(.semibold)
        .foregroundStyle(Color.black.opacity(0.7))
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
    }
    .background(Color(.white))
    .clipShape(RoundedRectangle(cornerRadius: 12))
    .disabled(viewModel.isAuthenticating)
  }

  private func accountRow(account: UserAccount) -> some View {
    Button {
      viewModel.selectAccount(accountId: account.id)
    }
    label: {
      HStack(spacing: 12) {
        createAvatar(account: account)

        VStack(alignment: .leading, spacing: 2) {
          Text(account.ownerUserActor?.username ?? account.name)
            .font(.headline)
            .foregroundStyle(Color.primary)
            .multilineTextAlignment(.leading)
        }

        Spacer()

        if viewModel.selectedAccountId == account.id {
          Image(systemName: "checkmark.circle.fill")
            .font(.system(size: 16, weight: .medium))
            .foregroundStyle(Color.green)
        }
      }
      .padding(.horizontal, 16)
      .padding(.vertical, 12)
      #if !os(tvOS) && !os(macOS)
      .background(Color(.systemBackground))
      #endif
    }
    .buttonStyle(PlainButtonStyle())
  }

  @ViewBuilder
  private func createAvatar(account: UserAccount) -> some View {
    let isOrganization = account.ownerUserActor == nil
    let profilePhoto = account.ownerUserActor?.primaryAccountProfileImageUrl
    let name = account.ownerUserActor?.fullName ?? account.name

    if isOrganization {
      let color = getAvatarColor(for: String(name.first ?? "o"))

      Circle()
        .fill(color.background)
        .frame(width: 32, height: 32)
        .overlay(
          Image(systemName: "building.2")
            .font(.system(size: 18))
            .foregroundStyle(color.foreground)
        )
    } else if let profilePhoto,
      let url = URL(string: profilePhoto) {
      Avatar(url: url) { image in
        image
          .resizable()
          .scaledToFill()
      } placeholder: {
        Circle()
        #if !os(tvOS) && !os(macOS)
          .fill(Color(.systemGray5))
        #endif
          .overlay(
            Image(systemName: "person")
              .font(.system(size: 18))
              .foregroundStyle(Color.secondary)
          )
      }
      .frame(width: 32, height: 32)
      .clipShape(Circle())
      .id("\(account.id)-\(profilePhoto)")
    } else {
      let firstLetter = (account.ownerUserActor?.username ?? account.name).prefix(1).uppercased()
      let color = getAvatarColor(for: String(firstLetter))

      Circle()
        .fill(color.background)
        .frame(width: 40, height: 40)
        .overlay(
          Text(firstLetter)
            .font(.system(size: 18, weight: .medium))
            .foregroundStyle(color.foreground)
        )
    }
  }
}
