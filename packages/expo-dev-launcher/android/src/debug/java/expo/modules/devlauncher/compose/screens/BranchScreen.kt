package expo.modules.devlauncher.compose.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import com.composeunstyled.Button
import expo.modules.devlauncher.R
import expo.modules.devlauncher.compose.Update
import expo.modules.devlauncher.compose.models.BranchAction
import expo.modules.devlauncher.compose.primitives.CircularProgressBar
import expo.modules.devlauncher.compose.ui.ScreenHeaderContainer
import expo.modules.devlauncher.compose.utils.DateFormat
import expo.modules.devmenu.compose.primitives.DayNighIcon
import expo.modules.devmenu.compose.primitives.Divider
import expo.modules.devmenu.compose.primitives.Heading
import expo.modules.devmenu.compose.primitives.RoundedSurface
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.primitives.Text
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun BranchScreen(
  branchName: String,
  updates: List<Update>,
  isLoading: Boolean,
  goBack: () -> Unit = {},
  onAction: (BranchAction) -> Unit = {}
) {
  Column(modifier = Modifier.fillMaxSize()) {
    ScreenHeaderContainer {
      Box(
        modifier = Modifier
          .fillMaxWidth()
          .padding(Theme.spacing.small)
      ) {
        RoundedSurface(
          color = Color.Transparent,
          modifier = Modifier.align(Alignment.CenterStart)
        ) {
          Button(
            onClick = goBack
          ) {
            DayNighIcon(
              R.drawable.chevron_right_icon,
              contentDescription = "Back icon",
              modifier = Modifier
                .rotate(180f)
                .size(Theme.sizing.icon.small)
            )
          }
        }

        Heading(branchName, modifier = Modifier.align(Alignment.Center))
      }
    }

    Divider()

    Spacer(Theme.spacing.small)

    val lazyListState = rememberLazyListState()

    val reachedBottom: Boolean by remember {
      derivedStateOf {
        val lastVisibleItem = lazyListState.layoutInfo.visibleItemsInfo.lastOrNull()
        val index = lastVisibleItem?.index ?: 0
        index != 0 && index > lazyListState.layoutInfo.totalItemsCount - 5
      }
    }

    LaunchedEffect(reachedBottom, isLoading) {
      if (reachedBottom && !isLoading) {
        onAction(BranchAction.LoadMoreUpdates)
      }
    }

    RoundedSurface(
      modifier = Modifier.padding(Theme.spacing.small)
    ) {
      LazyColumn(
        state = lazyListState
      ) {
        itemsIndexed(items = updates) { index, update ->
          val formatedTime = DateFormat.formatUpdateDate(update.createdAt)

          Button(onClick = {
            onAction(BranchAction.OpenUpdate(update))
          }) {
            Column(modifier = Modifier.padding(Theme.spacing.small)) {
              Row(
                verticalAlignment = Alignment.CenterVertically
              ) {
                DayNighIcon(
                  painter = painterResource(R.drawable.update_icon),
                  contentDescription = "Update Icon",
                  modifier = Modifier.size(Theme.sizing.icon.medium)
                )

                Spacer(Theme.spacing.small)

                Heading(
                  "Update: \"${update.name}\"",
                  fontSize = Theme.typography.medium,
                  maxLines = 1,
                  overflow = TextOverflow.Ellipsis,
                  modifier = Modifier.weight(1f)
                )

                Spacer(Theme.spacing.small)

                DayNighIcon(
                  painter = painterResource(R.drawable.chevron_right_icon),
                  contentDescription = "Chevron Right Icon",
                  modifier = Modifier.size(Theme.sizing.icon.extraSmall)
                )
              }

              Spacer(Theme.spacing.tiny)

              Text(
                "Published: $formatedTime",
                color = Theme.colors.text.secondary,
                modifier = Modifier
                  .padding(
                    start = Theme.sizing.icon.medium + Theme.spacing.small,
                    end = Theme.sizing.icon.medium + Theme.spacing.small
                  )
              )

              if (!update.isCompatible) {
                Spacer(Theme.spacing.tiny)

                Text(
                  "Incompatible update",
                  color = Theme.colors.text.warning,
                  modifier = Modifier
                    .padding(
                      start = Theme.sizing.icon.medium + Theme.spacing.small,
                      end = Theme.sizing.icon.medium + Theme.spacing.small
                    )
                )
              }
            }
          }

          if (index < updates.size - 1) {
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

        if (!isLoading && updates.isEmpty()) {
          item {
            Row(
              modifier = Modifier
                .fillMaxWidth()
                .padding(Theme.spacing.medium),
              horizontalArrangement = Arrangement.Center,
              verticalAlignment = Alignment.CenterVertically
            ) {
              Text(
                "No updates available.",
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
fun BranchScreenPreview() {
  BranchScreen(
    isLoading = true,
    branchName = "main",
    updates = listOf(
      Update(
        id = "1",
        name = "Update 1 with a very long name that should be truncated",
        createdAt = "2023-10-01T12:00:00Z",
        isCompatible = true,
        permalink = ""
      ),
      Update(
        id = "2",
        name = "Update 2",
        createdAt = "2023-10-02T12:00:00Z",
        isCompatible = false,
        permalink = ""
      ),
      Update(
        id = "3",
        name = "Update 3",
        createdAt = "2023-10-03T12:00:00Z",
        isCompatible = true,
        permalink = ""
      )
    )
  )
}
