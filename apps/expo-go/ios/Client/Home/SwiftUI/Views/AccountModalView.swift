import SwiftUI

struct AccountModalView: View {
  @Environment(\.dismiss) private var dismiss
  @EnvironmentObject var viewModel: HomeViewModel
  
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
      if let user = viewModel.currentUser {
        VStack(spacing: 0) {
          accountRow(user: user)
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
      Text("Log in or create an account to view your projects and Snacks.")
        .font(.system(size: 14))
        .foregroundColor(.secondary)
        .multilineTextAlignment(.leading)
        .frame(maxWidth: .infinity, alignment: .leading)
      
      VStack(spacing: 8) {
        signInButton
        signUpButton
      }
    }
    .padding(16)
    .background(Color(.systemBackground))
    .clipShape(RoundedRectangle(cornerRadius: 12))
  }
  
  private func accountRow(user: User) -> some View {
    Button {
    } label: {
      HStack(spacing: 12) {
        if let profilePhoto = user.profilePhoto,
           let url = URL(string: profilePhoto) {
          AsyncImage(url: url) { image in
            image
              .resizable()
              .aspectRatio(contentMode: .fill)
          } placeholder: {
            Circle()
              .fill(Color(.systemGray5))
              .overlay(
                Image(systemName: "person")
                  .foregroundColor(.secondary)
              )
          }
          .frame(width: 32, height: 32)
          .clipShape(Circle())
        } else {
          let firstLetter = user.username.prefix(1).uppercased()
          let color = getAvatarColor(for: String(firstLetter))
          
          Circle()
            .fill(color.background)
            .frame(width: 32, height: 32)
            .overlay(
              Text(firstLetter)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(color.foreground)
            )
        }
        
        VStack(alignment: .leading, spacing: 2) {
          Text(user.displayName ?? user.username)
            .font(.headline)
            .fontWeight(.medium)
            .foregroundColor(.primary)
          
          Text("@\(user.username)")
            .font(.caption)
            .foregroundColor(.secondary)
        }
        
        Spacer()
        
        Image(systemName: "checkmark")
          .font(.system(size: 16, weight: .medium))
          .foregroundColor(.blue)
      }
      .padding()
    }
    .buttonStyle(PlainButtonStyle())
  }
  
  private var signInButton: some View {
    Button {
    } label: {
      Text("Log in")
        .font(.headline)
        .fontWeight(.bold)
        .foregroundColor(.white)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
    }
    .background(Color.black)
    .cornerRadius(8)
  }
  
  private var signUpButton: some View {
    Button {
    } label: {
      Text("Sign up")
        .font(.headline)
        .fontWeight(.bold)
        .foregroundColor(.black)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
    }
    .background(Color.white)
    .overlay(
      RoundedRectangle(cornerRadius: 8)
        .stroke(Color.black, lineWidth: 1)
    )
    .cornerRadius(8)
  }
}

struct SignedInAccountView: View {
  let userName: String
  
  var body: some View {
    VStack(spacing: 20) {
      Image(systemName: "person.circle.fill")
        .font(.system(size: 80))
        .foregroundColor(.blue)
      
      Text(userName)
        .font(.title2)
        .fontWeight(.medium)
      
      VStack(spacing: 12) {
        Button("View Profile") {
        }
        .buttonStyle(.borderedProminent)
        
        Button("Switch Account") {
        }
        .buttonStyle(.bordered)
        
        Button("Sign Out") {
        }
        .foregroundColor(.red)
      }
      
      Spacer()
    }
    .padding()
  }
}

struct SignedOutAccountView: View {
  var body: some View {
    VStack(spacing: 20) {
      Image(systemName: "person.circle")
        .font(.system(size: 80))
        .foregroundColor(.gray)
      
      Text("Sign in to your account")
        .font(.title2)
        .fontWeight(.medium)
      
      Text("Sign in to save your projects and sync across devices")
        .font(.body)
        .multilineTextAlignment(.center)
        .foregroundColor(.secondary)
      
      Button("Sign In") {
        // TODO: Handle sign in
      }
      .buttonStyle(.borderedProminent)
      
      Spacer()
    }
    .padding()
  }
}

struct AccountModalView_Previews: PreviewProvider {
  static var previews: some View {
    AccountModalView()
      .environmentObject(HomeViewModel())
  }
}
