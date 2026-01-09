package host.exp.exponent.home

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import host.exp.exponent.graphql.fragment.CurrentUserActorData
import host.exp.expoview.R


@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AccountScreen(
  viewModel: HomeAppViewModel,
  goBack: () -> Unit
) {
  val account by viewModel.account.dataFlow.collectAsState()
  val selectedAccount by viewModel.selectedAccount.collectAsState()

  Scaffold(
    topBar = {
      TopAppBarWithBackIcon("Account", onGoBack = goBack)
    },
  ) { paddingValues ->
    Column(
      modifier = Modifier
          .fillMaxSize()
          .verticalScroll(rememberScrollState())
          .padding(paddingValues)
    ) {
      LabeledGroup(label = "Log Out", modifier = Modifier.padding(top = 8.dp), wrapWithCard = false) {
        Box(modifier = Modifier.padding(horizontal = 16.dp)) {
          Button(
            onClick = {
              viewModel.logout()
              goBack()
            },
            modifier = Modifier.fillMaxWidth()
          ) {
            Text("Log Out")
          }
        }
      }
      LabeledGroup(label = "Accounts", modifier = Modifier.padding(top = 8.dp)) {
        SeparatedList(account?.accounts ?: emptyList()) { item ->
          AccountRow(
            account = item,
            isSelected = item.id == selectedAccount?.id,
            onClick = {
              viewModel.selectAccount(item.id)
              goBack()
            }
          )
        }
      }
    }
  }
}

@Composable
private fun AccountRow(
  account: CurrentUserActorData.Account,
  isSelected: Boolean,
  onClick: () -> Unit
) {
  val owner = account.ownerUserActor

  @Composable
  fun Action() {
    if (isSelected) {
      Image(
        painter = painterResource(id = R.drawable.check),
        contentDescription = "Selected Account",
        modifier = Modifier.size(16.dp)
      )
    }
  }

  @Composable
  fun Content() {
    Column {
      val name = owner?.fullName?.takeIf { it.isNotBlank() }
        ?: owner?.username
        ?: account.name

      Text(
        text = name,
        fontWeight = FontWeight.SemiBold
      )

      if (owner?.username != null) {
        Spacer(modifier = Modifier.height(2.dp))
        Text(
          text = owner.username,
          style = MaterialTheme.typography.bodySmall,
          color = MaterialTheme.colorScheme.onSurfaceVariant
        )
      }
    }
  }

  ClickableItemRow(
    onClick = onClick,
    icon = {
      if (owner != null) {
        AsyncImage(
          model = owner.profilePhoto,
          contentDescription = "Account icon",
          modifier = Modifier
              .size(24.dp)
              .clip(CircleShape),
          contentScale = ContentScale.Crop
        )
      } else {
        Icon(
          painter = painterResource(R.drawable.account_circle),
          contentDescription = "Account icon",
          modifier = Modifier.size(24.dp)
        )
      }
    },
    content = { Content() },
    action = { Action() }
  )
}
