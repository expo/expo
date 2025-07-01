package expo.modules.devlauncher.compose.screens

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.composables.core.ModalBottomSheetState
import com.composables.core.SheetDetent.Companion.Hidden
import expo.modules.devlauncher.compose.AuthActivity
import expo.modules.devlauncher.compose.AuthRequestType
import expo.modules.devlauncher.compose.AuthResult
import expo.modules.devlauncher.compose.ProfileState
import expo.modules.devlauncher.compose.ProfileViewModel
import expo.modules.devlauncher.compose.ui.AccountSelector
import expo.modules.devlauncher.compose.ui.BottomSheet
import expo.modules.devlauncher.compose.ui.ProfileLayout
import expo.modules.devlauncher.compose.ui.SignUp

@Composable
fun Profile(
  bottomSheetState: ModalBottomSheetState,
  viewModel: ProfileViewModel = viewModel()
) {
  val state by viewModel.state.collectAsStateWithLifecycle()

  val authLauncher = rememberLauncherForActivityResult(AuthActivity.Contract()) { result ->
    when (result) {
      is AuthResult.Canceled -> {}
      is AuthResult.Success -> {
        viewModel.onAction(ProfileViewModel.Action.LogIn(result.sessionSecret))
      }
    }
  }

  BottomSheet(bottomSheetState) {
    ProfileLayout(onClose = {
      bottomSheetState.targetDetent = Hidden
    }) {
      when (state) {
        is ProfileState.LoggedIn -> {
          val state = state as ProfileState.LoggedIn
          AccountSelector(
            accounts = state.accounts,
            onSignOut = {
              viewModel.onAction(ProfileViewModel.Action.SignOut)
            }
          )
        }

        ProfileState.LoggedOut -> {
          SignUp(
            onLogIn = {
              authLauncher.launch(AuthRequestType.LOGIN)
            },
            onSignUp = {
              authLauncher.launch(AuthRequestType.SIGNUP)
            }
          )
        }
      }
    }
  }
}
