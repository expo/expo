package expo.modules.devlauncher.compose.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import com.composeunstyled.Button
import com.composeunstyled.Icon
import expo.modules.devlauncher.R
import expo.modules.devlauncher.compose.Branch
import expo.modules.devlauncher.compose.Update
import expo.modules.devlauncher.compose.models.BranchesAction
import expo.modules.devlauncher.compose.primitives.CircularProgressBar
import expo.modules.devlauncher.compose.ui.AppHeader
import expo.modules.devlauncher.compose.ui.ScreenHeaderContainer
import expo.modules.devlauncher.compose.utils.DateFormat
import expo.modules.devmenu.compose.primitives.DayNighIcon
import expo.modules.devmenu.compose.primitives.Divider
import expo.modules.devmenu.compose.primitives.Heading
import expo.modules.devmenu.compose.primitives.RoundedSurface
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.primitives.Text
import expo.modules.devmenu.compose.theme.Pallet
import expo.modules.devmenu.compose.theme.Theme
import kotlin.time.ExperimentalTime

@Composable
fun BranchBadge(
  name: String
) {
  val backgroundColor = if (Theme.isDarkTheme) {
    Pallet.Dark.Blue.blue200
  } else {
    Pallet.Light.Blue.blue200
  }

  val textColor = if (Theme.isDarkTheme) {
    Pallet.Dark.Blue.blue800
  } else {
    Pallet.Light.Blue.blue800
  }

  Row(
    verticalAlignment = Alignment.CenterVertically,
    modifier = Modifier
      .clip(RoundedCornerShape(Theme.sizing.borderRadius.medium))
      .background(backgroundColor)
      .padding(horizontal = Theme.spacing.small, vertical = Theme.spacing.tiny)
  ) {
    Icon(
      painter = painterResource(R.drawable.branch_icon),
      contentDescription = "Branch Icon",
      tint = textColor,
      modifier = Modifier.size(Theme.sizing.icon.extraSmall)
    )
    Spacer(Theme.spacing.tiny)
    Text("Branch: $name", color = textColor)
  }
}

@OptIn(ExperimentalTime::class)
@Composable
fun BranchesScreen(
  branches: List<Branch> = emptyList(),
  isLoading: Boolean = false,
  onProfileClick: () -> Unit = {},
  onAction: (BranchesAction) -> Unit = { _ -> }
) {
  Column(modifier = Modifier.fillMaxSize()) {
    ScreenHeaderContainer(modifier = Modifier.padding(Theme.spacing.medium)) {
      AppHeader(
        onProfileClick = onProfileClick
      )
    }

    Spacer(Theme.spacing.small)

    val lazyListState = rememberLazyListState()

    val reachedBottom: Boolean by remember {
      derivedStateOf {
        val lastVisibleItem = lazyListState.layoutInfo.visibleItemsInfo.lastOrNull()
        val index = lastVisibleItem?.index ?: 0
        index != 0 && index > lazyListState.layoutInfo.totalItemsCount - 5
      }
    }

    LaunchedEffect(reachedBottom) {
      if (reachedBottom && !isLoading) {
        onAction(BranchesAction.LoadMoreBranches)
      }
    }

    RoundedSurface(modifier = Modifier.padding(Theme.spacing.small)) {
      LazyColumn(
        state = lazyListState
      ) {
        itemsIndexed(items = branches) { index, branch ->
          Column {
            Button(onClick = {
              onAction(BranchesAction.OpenBranch(branch.name))
            }) {
              Column(
                modifier = Modifier.padding(horizontal = Theme.spacing.medium, vertical = Theme.spacing.small)
              ) {
                Row(
                  verticalAlignment = Alignment.CenterVertically,
                  modifier = Modifier
                    .fillMaxWidth()
                ) {
                  BranchBadge(branch.name)

                  Spacer(modifier = Modifier.weight(1f))

                  DayNighIcon(
                    painter = painterResource(R.drawable.chevron_right_icon),
                    contentDescription = "Chevron Right Icon",
                    modifier = Modifier.size(Theme.sizing.icon.extraSmall)
                  )
                }

                Spacer(Theme.spacing.small)

                val update = branch.compatibleUpdate
                if (update == null) {
                  Row {
                    Text(
                      "No compatible update found for this branch.",
                      color = Theme.colors.text.secondary,
                      modifier = Modifier.weight(1f),
                      textAlign = TextAlign.Center
                    )
                  }
                } else {
                  val formatedTime = DateFormat.formatUpdateDate(update.createdAt)

                  Row(
                    verticalAlignment = Alignment.CenterVertically
                  ) {
                    DayNighIcon(
                      painter = painterResource(R.drawable.update_icon),
                      contentDescription = "Update Icon"
                    )

                    Spacer(Theme.spacing.small)

                    Column {
                      Heading(
                        "Update: \"${update.name}\"",
                        fontSize = Theme.typography.medium,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.padding(end = Theme.sizing.icon.medium + Theme.spacing.small)
                      )

                      Spacer(Theme.spacing.tiny)

                      Text(
                        "Published: $formatedTime",
                        color = Theme.colors.text.secondary
                      )
                    }
                  }
                }
              }
            }
          }
          if (index < branches.size - 1) {
            Divider()
          }
        }

        if (isLoading) {
          item {
            Row(
              modifier = Modifier
                .fillMaxWidth()
                .padding(Theme.spacing.medium),
              horizontalArrangement = Arrangement.Center,
              verticalAlignment = Alignment.CenterVertically
            ) {
              CircularProgressBar(
                size = Theme.sizing.icon.large
              )
            }
          }
        }

        if (!isLoading && branches.isEmpty()) {
          item {
            Row(
              modifier = Modifier
                .fillMaxWidth()
                .padding(Theme.spacing.medium),
              horizontalArrangement = Arrangement.Center,
              verticalAlignment = Alignment.CenterVertically
            ) {
              Text(
                "No branches available.",
                color = Theme.colors.text.secondary,
                textAlign = TextAlign.Center
              )
            }
          }
        }
      }
    }
  }
}

@Preview(showBackground = true)
@Composable
fun BranchesScreenPreview() {
  BranchesScreen(
    isLoading = false,
    branches = listOf(
      Branch(
        name = "main",
        compatibleUpdate = Update(
          id = "1",
          name = "Update 1",
          createdAt = "2022-09-15T19:29:12.244Z",
          isCompatible = true,
          permalink = ""
        )
      ),
      Branch(
        name = "develop",
        compatibleUpdate = Update(
          id = "2",
          name = "Update 2 with very long name that should be truncated",
          createdAt = "2022-09-15T19:29:12.244Z",
          permalink = ""
        )
      ),
      Branch(
        name = "staging",
        compatibleUpdate = null
      )
    )
  )
}
