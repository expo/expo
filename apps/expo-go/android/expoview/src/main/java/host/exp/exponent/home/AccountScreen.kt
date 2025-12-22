package host.exp.exponent.home

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import host.exp.expoview.R
import androidx.compose.ui.res.painterResource
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import androidx.compose.ui.platform.LocalContext
import host.exp.exponent.graphql.Home_CurrentUserActorQuery
import host.exp.exponent.graphql.fragment.CurrentUserActorData
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch


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
            LabeledGroup(label = "Log Out") {
                Button(onClick = {
                    viewModel.logout()
                    goBack()
                }, modifier = Modifier.fillMaxWidth()) {
                    Text("Log Out")
                }
            }
            LabeledGroup(label = "Accounts") {
                SeparatedList(account?.accounts ?: emptyList(), renderItem = { item ->
                    AccountRow(
                        account = item,
                        isSelected = item.id == selectedAccount?.id,
                        onClick = {
                            viewModel.selectAccount(item.id)
                            goBack()
                        }
                    )
                })
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
            if (owner != null) {
                if (!owner.fullName.isNullOrBlank()) {
                    // Case 1: Display Full Name and Username
                    Text(text = owner.fullName, fontWeight = FontWeight.SemiBold)
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = owner.username,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                } else {
                    // Case 2: Display only Username
                    Text(text = owner.username, fontWeight = FontWeight.SemiBold)
                }
            } else {
                // Case 3: Fallback to account.name
                Text(text = account.name, fontWeight = FontWeight.Bold)
            }
        }
    }

    if (owner != null) {
        ClickableItemRow(onClick = { onClick() }, imageUrl = owner.profilePhoto, content = {
            Content()
        }, action = {
            Action()
        })
        return
    } else {
        ClickableItemRow(
            onClick = { onClick() },
            icon = painterResource(expo.modules.devmenu.R.drawable.alert),
            content = {
                Content()
            },
            action = {
                Action()
            })
    }
}