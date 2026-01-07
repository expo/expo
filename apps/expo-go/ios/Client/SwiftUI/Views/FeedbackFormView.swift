//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct FeedbackFormView: View {
  @Environment(\.dismiss) private var dismiss
  @EnvironmentObject var viewModel: HomeViewModel
  @State private var feedback = ""
  @State private var email = ""
  @State private var isSubmitting = false
  @State private var submitted = false
  @State private var errorMessage: String?

  private let service = FeedbackService()

  var body: some View {
    if submitted {
      SubmittedView {
        dismiss()
      }
    } else {
      FormView(email: $email, feedback: $feedback, errorMessage: $errorMessage, isSubmitting: isSubmitting) {
        Task {
          await submitFeedback()
        }
      }
      .onAppear {
        if email.isEmpty {
          email = viewModel.user?.bestContactEmail ?? ""
        }
      }
    }
  }

  private func submitFeedback() async {
    guard !isSubmitting else { return }
    errorMessage = nil
    isSubmitting = true
    defer { isSubmitting = false }

    let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
    if !trimmedEmail.isEmpty && !isValidEmail(trimmedEmail) {
      errorMessage = "Please enter a valid email address."
      return
    }

    do {
      try await service.submitFeedback(message: feedback, email: trimmedEmail.isEmpty ? nil : trimmedEmail)
      submitted = true
    } catch let error as APIError {
      errorMessage = error.localizedDescription
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  private func isValidEmail(_ email: String) -> Bool {
    if #available(iOS 16, *) {
      let regex = /.+@.+\..+/
      return email.wholeMatch(of: regex) != nil
    } else {
      let fallback = "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$"
      return NSPredicate(format: "SELF MATCHES %@", fallback).evaluate(with: email)
    }
  }
}

struct FormView: View {
  @Binding var email: String
  @Binding var feedback: String
  @Binding var errorMessage: String?
  let isSubmitting: Bool
  let submitFeedback: () -> Void

  var body: some View {
    VStack(spacing: 0) {
      ScrollView {
        VStack(alignment: .leading, spacing: 12) {
          Text("Add your feedback to help us improve the app.")
            .font(.subheadline)
            .foregroundColor(.secondary)

          Text("Email (optional)")
            .font(.headline)

          TextField("your@email.com", text: $email)
            .keyboardType(.emailAddress)
            .textInputAutocapitalization(.none)
            .disableAutocorrection(true)
            .padding()
            .background(Color.expoSecondarySystemBackground)
            .clipShape(RoundedRectangle(cornerRadius: BorderRadius.medium))

          Text("Feedback")
            .font(.headline)

          TextEditor(text: $feedback)
            .frame(height: 200)
            .padding(8)
            .background(Color.expoSecondarySystemBackground)
            .clipShape(RoundedRectangle(cornerRadius: BorderRadius.medium))
        }
        .padding()
      }

      if let errorMessage {
        VStack(alignment: .leading, spacing: 4) {
          Text("Something went wrong. Please try again.")
            .font(.subheadline)
            .foregroundColor(.red)
          Text(errorMessage)
            .font(.caption)
            .foregroundColor(.red)
        }
        .padding([.horizontal, .bottom])
      }

      Button {
        submitFeedback()
      } label: {
        if isSubmitting {
          ProgressView()
            .frame(maxWidth: .infinity)
            .padding()
        } else {
          Text("Submit")
            .font(.headline)
            .frame(maxWidth: .infinity)
            .padding()
        }
      }
      .background(feedback.isEmpty || isSubmitting ? Color.gray.opacity(0.3) : Color.black)
      .foregroundColor(feedback.isEmpty || isSubmitting ? .secondary : .white)
      .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
      .disabled(feedback.isEmpty || isSubmitting)
      .padding()
    }
    .background(Color.expoSystemBackground)
    .navigationTitle("Feedback")
    .navigationBarTitleDisplayMode(.inline)
  }
}

struct SubmittedView: View {
  let dismiss: () -> Void
  
  var body: some View {
    VStack(spacing: 16) {
      Image(systemName: "checkmark.circle.fill")
        .font(.system(size: 64))
        .foregroundColor(.green)

      Text("Thanks for sharing your feedback!")
        .font(.headline)

      Text("Your feedback will help us make our app better.")
        .font(.subheadline)
        .foregroundColor(.secondary)
        .multilineTextAlignment(.center)

      Button("Continue") {
        dismiss()
      }
      .frame(maxWidth: .infinity)
      .padding()
      .background(Color.black)
      .foregroundColor(.white)
      .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
    }
    .padding()
    .navigationTitle("Feedback")
    .navigationBarTitleDisplayMode(.inline)
  }
}
