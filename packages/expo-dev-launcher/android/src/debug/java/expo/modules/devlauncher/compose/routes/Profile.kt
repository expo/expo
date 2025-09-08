package expo.modules.devlauncher.compose.routes

import androidx.activity.compose.ManagedActivityResultLauncher
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.dropShadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.shadow.Shadow
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.DpOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.composables.core.ModalBottomSheetState
import expo.modules.devlauncher.compose.AuthActivity
import expo.modules.devlauncher.compose.AuthRequestType
import expo.modules.devlauncher.compose.AuthResult
import expo.modules.devlauncher.compose.models.ProfileState
import expo.modules.devlauncher.compose.models.ProfileViewModel
import expo.modules.devlauncher.compose.primitives.CircularProgressBar
import expo.modules.devlauncher.compose.ui.AccountSelector
import expo.modules.devlauncher.compose.ui.BottomSheet
import expo.modules.devlauncher.compose.ui.LauncherIcons
import expo.modules.devlauncher.compose.ui.SignUp
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.NewText

@Composable
fun ProfileRoute(
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
    val state = state // capture state for when statement
    when (state) {
      is ProfileState.LoggedIn -> LoggedIn(state, viewModel)
      ProfileState.LoggedOut -> LoggedOut(authLauncher)
      ProfileState.Fetching -> Loading()
    }
  }
}

@Composable
private fun Loading() {
  Box(
    contentAlignment = Alignment.Center,
    modifier = Modifier
      .fillMaxWidth()
      .height(300.dp)
  ) {
    CircularProgressBar(size = 72.dp)
  }
}

@Composable
private fun LoggedOut(authLauncher: ManagedActivityResultLauncher<AuthRequestType, AuthResult>) {
  Column(
    verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`4`)
  ) {
    Row(
      horizontalArrangement = Arrangement.Center,
      modifier = Modifier
        .fillMaxWidth()
    ) {
      val shape = RoundedCornerShape(NewAppTheme.borderRadius.md)

      Box(
        modifier = Modifier
          .size(44.dp)
          .dropShadow(
            shape = shape,
            shadow = Shadow(
              radius = 10.dp,
              offset = DpOffset(0.dp, 5.dp),
              color = Color.Black.copy(alpha = 0.05f)
            )
          )
          .dropShadow(
            shape = shape,
            shadow = Shadow(
              radius = 25.dp,
              offset = DpOffset(0.dp, 15.dp),
              color = Color.Black.copy(alpha = 0.12f)
            )
          )
          .background(
            Color.White,
            shape = shape
          )
      ) {
        LauncherIcons.ExpoLogo(
          size = 24.dp,
          tint = Color.Black,
          modifier = Modifier.align(Alignment.Center)
        )
      }
    }

    NewText(
      "Login or create an account to view local\ndevelopment servers and more",
      style = NewAppTheme.font.sm.merge(
        lineHeight = 19.sp,
        textAlign = TextAlign.Center
      ),
      color = NewAppTheme.colors.text.secondary,
      modifier = Modifier.fillMaxWidth()
    )

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

@Composable
private fun LoggedIn(state: ProfileState.LoggedIn, viewModel: ProfileViewModel) {
  AccountSelector(
    accounts = state.accounts,
    onSignOut = {
      viewModel.onAction(ProfileViewModel.Action.SignOut)
    },
    onClick = { account ->
      viewModel.onAction(ProfileViewModel.Action.SwitchAccount(account))
    }
  )
}
