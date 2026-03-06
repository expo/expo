//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI
import UIKit

struct SimulatorAccountView: View {
  @Environment(\.dismiss) private var dismiss
  @EnvironmentObject var viewModel: HomeViewModel

  var body: some View {
    VStack(spacing: 0) {
      header

      if !viewModel.isAuthenticated {
        Spacer()
        Image("expo-go-logo")
          .resizable()
          .aspectRatio(contentMode: .fit)
          .frame(width: 180)
          .foregroundColor(.expoBlue)
        Spacer()
      }

      VStack(spacing: 0) {
        if viewModel.isAuthenticated {
          AccountSelectorView()
            .padding(.horizontal, 16)
        } else {
          loginSignupCard
            .padding(.horizontal, 16)
        }
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(Color.expoSystemBackground)
  }

  private var header: some View {
    VStack(spacing: 8) {
      HStack {
        Text("Account")
          .font(.title2)
          .fontWeight(.semibold)

        Spacer()

        Button {
          dismiss()
        } label: {
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

  private var loginSignupCard: some View {
    VStack(spacing: 16) {
      Text("Log in or create an account to access your projects, view local development servers, and more.")
        .font(.system(size: 16))
        .foregroundColor(.secondary)

      VStack(spacing: 8) {
        signInButton
        signUpButton
      }
    }
  }

  private var signInButton: some View {
    Button {
      UIImpactFeedbackGenerator(style: .light).impactOccurred()
      Task {
        await viewModel.signIn()
      }
    } label: {
      HStack(spacing: 8) {
        if viewModel.isAuthenticating {
          ProgressView()
            .tint(.white)
            .scaleEffect(0.8)
            .transition(.scale.combined(with: .opacity))
        }

        Text("Log In")
          .font(.headline)
          .fontWeight(.semibold)
      }
      .foregroundColor(.white)
      .frame(maxWidth: .infinity)
      .padding(.vertical, 12)
      .animation(.easeInOut(duration: 0.2), value: viewModel.isAuthenticating)
    }
    .background(Color.black)
    .cornerRadius(12)
    .disabled(viewModel.isAuthenticating)
  }

  private var signUpButton: some View {
    Button {
      UIImpactFeedbackGenerator(style: .light).impactOccurred()
      Task {
        await viewModel.signUp()
      }
    } label: {
      Text("Sign Up")
        .font(.headline)
        .fontWeight(.semibold)
        .foregroundColor(.black.opacity(0.7))
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
    }
    .background(Color.white)
    .cornerRadius(12)
    .disabled(viewModel.isAuthenticating)
  }
}
