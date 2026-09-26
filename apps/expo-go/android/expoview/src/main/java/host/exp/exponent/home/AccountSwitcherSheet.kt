package host.exp.exponent.home

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil3.compose.AsyncImage
import host.exp.expoview.R
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AccountSwitcherSheet(
  viewModel: HomeAppViewModel,
  onDismiss: () -> Unit
) {
  val state by viewModel.sessions.collectAsStateWithLifecycle()
  val sections = remember(state) { AccountSwitcherSections.make(state) }
  var pendingSignOut by remember { mutableStateOf<AccountSwitcherSection?>(null) }
  val sheetState = rememberModalBottomSheetState()
  val scope = rememberCoroutineScope()

  fun hideThenDismiss() {
    scope.launch { sheetState.hide() }.invokeOnCompletion {
      if (!sheetState.isVisible) {
        onDismiss()
      }
    }
  }

  ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState) {
    Column(
      verticalArrangement = Arrangement.spacedBy(8.dp),
      modifier = Modifier
        .fillMaxWidth()
        .verticalScroll(rememberScrollState())
        .padding(start = 16.dp, end = 16.dp, bottom = 16.dp)
    ) {
      Text(
        text = "Accounts",
        style = MaterialTheme.typography.titleLarge,
        fontWeight = FontWeight.SemiBold,
        textAlign = TextAlign.Center,
        modifier = Modifier
          .fillMaxWidth()
          .padding(vertical = 8.dp)
      )

      Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        sections.forEach { section ->
          AccountSwitcherSectionItem(
            section = section,
            showsHeader = sections.size > 1,
            onSelect = { row ->
              viewModel.selectAccount(row.account.id, row.sessionId)
              hideThenDismiss()
            },
            onSignOut = { pendingSignOut = section }
          )
        }
      }

      AddAccountRow(onClick = viewModel::login)
    }
  }

  pendingSignOut?.let { section ->
    AlertDialog(
      onDismissRequest = { pendingSignOut = null },
      title = { Text("Log out of ${section.username}?") },
      confirmButton = {
        TextButton(onClick = {
          viewModel.logout(section.sessionId)
          pendingSignOut = null
        }) {
          Text("Log out")
        }
      },
      dismissButton = {
        TextButton(onClick = { pendingSignOut = null }) { Text("Cancel") }
      }
    )
  }
}

@Composable
private fun AccountSwitcherSectionItem(
  section: AccountSwitcherSection,
  showsHeader: Boolean,
  onSelect: (AccountSwitcherRow) -> Unit,
  onSignOut: () -> Unit
) {
  Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
    if (showsHeader) {
      Text(
        text = section.username,
        style = MaterialTheme.typography.labelMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = Modifier.padding(horizontal = 8.dp)
      )
    }
    section.rows.forEach { row ->
      AccountSwitcherRowItem(
        row = row,
        isPartner = section.isPartner,
        onClick = { onSelect(row) },
        onLongClick = onSignOut
      )
    }
  }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun AccountSwitcherRowItem(
  row: AccountSwitcherRow,
  isPartner: Boolean,
  onClick: () -> Unit,
  onLongClick: () -> Unit
) {
  val shape = RoundedCornerShape(16.dp)
  Row(
    verticalAlignment = Alignment.CenterVertically,
    horizontalArrangement = Arrangement.spacedBy(8.dp),
    modifier = Modifier
      .fillMaxWidth()
      .clip(shape)
      .background(if (row.isSelected) MaterialTheme.colorScheme.surfaceVariant else Color.Transparent, shape)
      .combinedClickable(onClick = onClick, onLongClick = onLongClick)
      .padding(8.dp)
  ) {
    Box {
      AccountAvatar(row.account.ownerUserId != null, row.account.ownerAvatarUrl)
      if (isPartner) {
        PartnerBadge(
          modifier = Modifier
            .align(Alignment.BottomEnd)
            .offset(x = 4.dp)
        )
      }
    }

    Text(
      text = row.account.ownerFullName?.takeIf { it.isNotBlank() } ?: row.account.name,
      style = MaterialTheme.typography.bodyMedium,
      fontWeight = FontWeight.Medium,
      maxLines = 1,
      overflow = TextOverflow.Ellipsis,
      modifier = Modifier.weight(1f)
    )

    Icon(
      painter = painterResource(R.drawable.check),
      contentDescription = if (row.isSelected) "Selected account" else null,
      tint = MaterialTheme.colorScheme.onSurfaceVariant,
      modifier = Modifier
        .size(16.dp)
        .alpha(if (row.isSelected) 1f else 0f)
    )
  }
}

@Composable
private fun AccountAvatar(isPersonal: Boolean, avatarUrl: String?) {
  if (isPersonal) {
    AsyncImage(
      model = avatarUrl,
      contentDescription = null,
      contentScale = ContentScale.Crop,
      modifier = Modifier
        .size(32.dp)
        .clip(CircleShape)
    )
  } else {
    Icon(
      painter = painterResource(R.drawable.account_circle),
      contentDescription = null,
      modifier = Modifier.size(32.dp)
    )
  }
}

@Composable
private fun AddAccountRow(onClick: () -> Unit) {
  Row(
    verticalAlignment = Alignment.CenterVertically,
    horizontalArrangement = Arrangement.spacedBy(8.dp),
    modifier = Modifier
      .fillMaxWidth()
      .clip(RoundedCornerShape(16.dp))
      .clickable(onClick = onClick)
      .padding(8.dp)
  ) {
    Box(contentAlignment = Alignment.Center, modifier = Modifier.size(24.dp)) {
      Icon(
        painter = painterResource(R.drawable.plus),
        contentDescription = null,
        tint = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = Modifier.size(16.dp)
      )
    }
    Text(
      text = "Add account",
      style = MaterialTheme.typography.labelLarge,
      fontWeight = FontWeight.SemiBold,
      color = MaterialTheme.colorScheme.onSurfaceVariant
    )
    Spacer(modifier = Modifier.weight(1f))
  }
}
