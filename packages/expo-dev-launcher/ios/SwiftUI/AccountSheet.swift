// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct AccountSheet: View {
  @Environment(\.dismiss) private var dismiss
  @EnvironmentObject var viewModel: DevLauncherViewModel

  var body: some View {
    ScrollView {
      VStack(spacing: 0) {
        accountScreenHeader

        Spacer(minLength: 16)

        VStack(spacing: 0) {
          if viewModel.isAuthenticated {
            userAccountSelector
          } else {
            loginSignupCard
          }
        }
        .padding(.horizontal, 16)

        Spacer()
      }
    }
    .background(Color(.systemGroupedBackground))
  }

  private var accountScreenHeader: some View {
    VStack(spacing: 8) {
      HStack {
        Text("Account")
          .font(.title2)
          .fontWeight(.semibold)

        Spacer()

        Button {
          dismiss()
        }
        label: {
          Image(systemName: "xmark")
            .font(.system(size: 16, weight: .medium))
            .foregroundColor(.primary)
            .frame(width: 44, height: 44)
        }
      }
      .padding(.horizontal, 16)
      .padding(.top, 8)
    }
  }

  private var userAccountSelector: some View {
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
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
      }

      Button {
        viewModel.signOut()
      }
      label: {
        Text("Log Out")
          .font(.headline)
          .fontWeight(.bold)
          .foregroundColor(.white)
          .frame(maxWidth: .infinity)
          .padding(.vertical, 12)
      }
      .background(Color.black)
      .cornerRadius(8)
    }
  }

  private var loginSignupCard: some View {
    VStack(spacing: 16) {
      Text("Log in or create an account to view local development servers and more.")
        .font(.system(size: 14))
        .foregroundColor(.secondary)
        .multilineTextAlignment(.leading)
        .frame(maxWidth: .infinity, alignment: .leading)

      VStack(spacing: 8) {
        signInButton
        signUpButton
      }

      if viewModel.isAuthenticating {
        ProgressView()
          .scaleEffect(0.8)
      }
    }
    .padding(16)
    .background(Color(.systemBackground))
    .cornerRadius(12)
  }

  private var signInButton: some View {
    Button {
      Task {
        await viewModel.signIn()
      }
    }
    label: {
      Text("Log In")
        .font(.headline)
        .fontWeight(.semibold)
        .foregroundColor(.white)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
    }
    .background(Color.black)
    .cornerRadius(8)
    .disabled(viewModel.isAuthenticating)
  }

  private var signUpButton: some View {
    Button {
      Task {
        await viewModel.signUp()
      }
    }
    label: {
      Text("Sign Up")
        .font(.headline)
        .fontWeight(.semibold)
        .foregroundColor(.black)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
    }
    .background(Color(.systemGray5))
    .cornerRadius(8)
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
            .foregroundColor(.primary)
            .multilineTextAlignment(.leading)
        }

        Spacer()

        if viewModel.selectedAccountId == account.id {
          Image(systemName: "checkmark")
            .font(.system(size: 16, weight: .medium))
            .foregroundColor(.gray)
        }
      }
      .padding(.horizontal, 16)
      .padding(.vertical, 12)
      .background(Color(.systemBackground))
    }
    .buttonStyle(PlainButtonStyle())
  }

  @ViewBuilder
  private func createAvatar(account: UserAccount) -> some View {
    let isOrganization = account.ownerUserActor == nil
    let profilePhoto = account.ownerUserActor?.profilePhoto
    let name = account.ownerUserActor?.fullName ?? account.name

    if isOrganization {
      let color = getAvatarColor(for: String(name.first ?? "o"))

      Circle()
        .fill(color.background)
        .frame(width: 32, height: 32)
        .overlay(
          Image(systemName: "building.2")
            .font(.system(size: 18))
            .foregroundColor(color.foreground)
        )
    } else if let profilePhoto,
      let url = URL(string: profilePhoto) {
      Avatar(url: url) { image in
        image
          .resizable()
          .aspectRatio(contentMode: .fill)
      } placeholder: {
        Circle()
          .fill(Color(.systemGray5))
          .overlay(
            Image(systemName: "person")
              .font(.system(size: 18))
              .foregroundColor(.secondary)
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
            .foregroundColor(color.foreground)
        )
    }
  }
}
