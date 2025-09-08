package expo.modules.devlauncher.compose.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.composeunstyled.Button
import expo.modules.devlauncher.compose.Update
import expo.modules.devlauncher.compose.models.BranchAction
import expo.modules.devlauncher.compose.primitives.CircularProgressBar
import expo.modules.devlauncher.compose.ui.DefaultScreenContainer
import expo.modules.devlauncher.compose.ui.LauncherIcons
import expo.modules.devlauncher.compose.utils.DateFormat
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.Divider
import expo.modules.devmenu.compose.primitives.NewText
import expo.modules.devmenu.compose.primitives.RoundedSurface
import expo.modules.devmenu.compose.primitives.Spacer

@Composable
fun BranchScreen(
  branchName: String,
  updates: List<Update>,
  isLoading: Boolean,
  goBack: () -> Unit = {},
  onAction: (BranchAction) -> Unit = {}
) {
  Column(modifier = Modifier.fillMaxSize()) {
    Box(
      modifier = Modifier
        .fillMaxWidth()
        .padding(NewAppTheme.spacing.`4`)
    ) {
      RoundedSurface(
        color = Color.Transparent,
        modifier = Modifier.align(Alignment.CenterStart)
      ) {
        Button(
          onClick = goBack
        ) {
          LauncherIcons.Chevron(
            size = 20.dp,
            tint = NewAppTheme.colors.icon.default
          )
        }
      }

      NewText(
        branchName,
        style = NewAppTheme.font.xxl.merge(
          fontWeight = FontWeight.Bold
        ),
        modifier = Modifier.align(Alignment.Center)
      )
    }

    Divider(
      thickness = 0.5.dp,
      color = NewAppTheme.colors.border.default
    )

    Spacer(NewAppTheme.spacing.`4`)

    Column(
      modifier = Modifier.padding(horizontal = NewAppTheme.spacing.`4`)
    ) {
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
        color = NewAppTheme.colors.background.subtle
      ) {
        LazyColumn(
          state = lazyListState
        ) {
          itemsIndexed(items = updates) { index, update ->
            val formatedTime = DateFormat.formatUpdateDate(update.createdAt)

            Button(
              modifier = Modifier
                .background(
                  NewAppTheme.colors.background.subtle,
                  shape = RoundedCornerShape(NewAppTheme.borderRadius.xl)
                ),
              onClick = {
                onAction(BranchAction.OpenUpdate(update))
              }
            ) {
              Row(
                horizontalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`2`),
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                  .fillMaxWidth()
                  .padding(NewAppTheme.spacing.`3`)
              ) {
                LauncherIcons.Updates(
                  size = 20.dp,
                  tint = NewAppTheme.colors.icon.tertiary
                )

                Column(
                  verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`1`),
                  modifier = Modifier.weight(1f)
                ) {
                  NewText(
                    "Update: \"${update.name}\"",
                    style = NewAppTheme.font.md.merge(
                      fontWeight = FontWeight.Medium
                    ),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                  )

                  NewText(
                    "Published: $formatedTime",
                    style = NewAppTheme.font.sm,
                    color = NewAppTheme.colors.text.secondary
                  )

                  if (!update.isCompatible) {
                    NewText(
                      "Incompatible update",
                      color = NewAppTheme.colors.text.warning,
                      style = NewAppTheme.font.sm.merge(
                        fontWeight = FontWeight.Medium
                      )
                    )
                  }
                }

                LauncherIcons.Chevron(
                  size = 16.dp,
                  tint = NewAppTheme.colors.icon.tertiary
                )
              }
            }

            if (index < updates.size - 1) {
              Divider(
                thickness = 0.5.dp,
                color = NewAppTheme.colors.border.default
              )
            }
          }

          if (isLoading) {
            item {
              Row(
                modifier = Modifier
                  .fillMaxWidth()
                  .padding(vertical = NewAppTheme.spacing.`2`),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
              ) {
                CircularProgressBar(
                  size = 44.dp
                )
              }
            }
          } else if (updates.isEmpty()) {
            item {
              Row(
                modifier = Modifier
                  .fillMaxWidth()
                  .padding(NewAppTheme.spacing.`3`),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
              ) {
                NewText(
                  "No updates available.",
                  style = NewAppTheme.font.lg.merge(
                    textAlign = TextAlign.Center,
                    fontWeight = FontWeight.Medium
                  ),
                  color = NewAppTheme.colors.text.secondary
                )
              }
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
  DefaultScreenContainer {
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
}
