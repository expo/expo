// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct AccountSheet: View {
  @Environment(\.dismiss) private var dismiss
  @EnvironmentObject var viewModel: DevLauncherViewModel

  var body: some View {
    VStack(spacing: 24) {
      HStack(spacing: 8) {
        Text("Account")
          .font(.title)
          .fontWeight(.semibold)
        Spacer()
        Image(systemName: "xmark")
          .onTapGesture {
            dismiss()
          }
      }

      if viewModel.isAuthenticated {
        authenticated
      } else {
        unauthenticated
      }

      Spacer()
    }
    .padding()
    .background(Color(.systemGroupedBackground))
  }

  private var authenticated: some View {
    VStack(spacing: 16) {
      VStack(spacing: 8) {
        createAvatar()
        Text(viewModel.userInfo?["username"] as? String ?? "user@example.com")
          .font(.headline)
      }
      signOutButton
    }
  }

  private var unauthenticated: some View {
    VStack(alignment: .leading, spacing: 15) {
      Text("Log in or create an account to view local development servers and more.")
        .foregroundColor(.secondary)
        .font(.caption)

      signInButton
      signUpButton
    }
    .padding()
    .background(Color.white)
    .cornerRadius(10)
  }

  @ViewBuilder
  func createAvatar() -> some View {
    if let profilePhotoURL = viewModel.userInfo?["profilePhoto"] as? String,
      let url = URL(string: profilePhotoURL) {
      AsyncImage(url: url) { image in
        image
          .resizable()
          .aspectRatio(contentMode: .fill)
      } placeholder: {
        Image(systemName: "person.circle.fill")
          .font(.system(size: 60))
          .foregroundColor(.blue)
      }
      .frame(width: 60, height: 60)
      .clipShape(Circle())
    } else {
      Image(systemName: "person.circle.fill")
        .font(.system(size: 60))
        .foregroundColor(.blue)
    }
  }

  private var signInButton: some View {
    Button {
      viewModel.signIn()
    } label: {
      HStack {
        if viewModel.isAuthenticating {
          ProgressView()
            .scaleEffect(0.8)
            .progressViewStyle(CircularProgressViewStyle(tint: .white))
        }
        Text(viewModel.isAuthenticating ? "Signing In..." : "Log In")
          .font(.headline)
          .foregroundColor(.white)
      }
      .frame(maxWidth: .infinity)
      .padding(.vertical, 12)
    }
    .background(Color.black)
    .cornerRadius(8)
    .disabled(viewModel.isAuthenticating)
  }

  private var signUpButton: some View {
    Button {
      viewModel.signUp()
    } label: {
      HStack {
        if viewModel.isAuthenticating {
          ProgressView()
            .scaleEffect(0.8)
            .progressViewStyle(CircularProgressViewStyle(tint: .black))
        }
        Text(viewModel.isAuthenticating ? "Signing Up..." : "Sign Up")
          .font(.headline)
          .foregroundColor(.black)
      }
      .frame(maxWidth: .infinity)
      .padding(.vertical, 12)
    }
    .background(Color.gray.opacity(0.2))
    .cornerRadius(8)
    .disabled(viewModel.isAuthenticating)
  }

  private var signOutButton: some View {
    Button {
      viewModel.signOut()
    } label: {
      Text("Sign Out")
        .font(.headline)
        .foregroundColor(.white)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
    }
    .background(Color.red)
    .cornerRadius(8)
  }
}

#Preview {
  AccountSheet()
}
