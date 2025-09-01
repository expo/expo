package expo.modules.devlauncher.compose.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.composeunstyled.Icon
import expo.modules.devlauncher.R
import expo.modules.devlauncher.compose.Branch
import expo.modules.devlauncher.compose.Update
import expo.modules.devlauncher.compose.models.BranchesAction
import expo.modules.devlauncher.compose.primitives.CircularProgressBar
import expo.modules.devlauncher.compose.ui.ActionButton
import expo.modules.devlauncher.compose.ui.AppHeader
import expo.modules.devlauncher.compose.ui.DefaultScreenContainer
import expo.modules.devlauncher.compose.ui.LauncherIcons
import expo.modules.devlauncher.compose.utils.DateFormat
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.NewText
import expo.modules.devmenu.compose.primitives.RoundedSurface
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.ui.MenuIcons
import kotlin.time.ExperimentalTime

@Composable
private fun BranchBadge(
  name: String
) {
  val backgroundColor = NewAppTheme.colors.background.info
  val textColor = NewAppTheme.colors.text.link

  Row(
    verticalAlignment = Alignment.CenterVertically,
    horizontalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`2`),
    modifier = Modifier
      .clip(RoundedCornerShape(NewAppTheme.borderRadius.md))
      .background(backgroundColor)
      .padding(NewAppTheme.spacing.`2`)
  ) {
    LauncherIcons.Branch(
      size = 16.dp,
      tint = textColor
    )

    NewText(
      "Branch: $name",
      style = NewAppTheme.font.sm.merge(
        fontFamily = NewAppTheme.font.mono,
        fontSize = 13.sp
      ),
      color = textColor
    )
  }
}

@Composable
private fun NeedToSingInComponent(
  onProfileClick: () -> Unit = {}
) {
  Box(
    contentAlignment = Alignment.Center,
    modifier = Modifier.fillMaxSize()
  ) {
    Column(
      verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`4`),
      horizontalAlignment = Alignment.CenterHorizontally,
      modifier = Modifier.fillMaxWidth()
    ) {
      Icon(
        painter = painterResource(R.drawable.log_in),
        contentDescription = "Sign In Icon",
        tint = NewAppTheme.colors.icon.info
      )

      Column(
        verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`2`),
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.fillMaxWidth()
      ) {
        NewText(
          "Sign in to view updates",
          style = NewAppTheme.font.lg.merge(
            fontWeight = FontWeight.SemiBold,
            lineHeight = 20.sp,
            textAlign = TextAlign.Center
          )
        )

        NewText(
          "Sign in to your Expo account to see available\nEAS updates for this project.",
          style = NewAppTheme.font.sm.merge(
            lineHeight = 19.6.sp,
            textAlign = TextAlign.Center
          ),
          color = NewAppTheme.colors.text.secondary
        )
      }

      ActionButton(
        "Sign In",
        foreground = Color.White,
        background = Color.Black,
        fill = false,
        modifier = Modifier
          .padding(
            horizontal = NewAppTheme.spacing.`3`,
            vertical = NewAppTheme.spacing.`2`
          ),
        onClick = onProfileClick
      )
    }
  }
}

@OptIn(ExperimentalTime::class)
@Composable
fun BranchesScreen(
  branches: List<Branch> = emptyList(),
  needToSignIn: Boolean = false,
  isLoading: Boolean = false,
  onProfileClick: () -> Unit = {},
  onAction: (BranchesAction) -> Unit = { _ -> }
) {
  Column(
    modifier = Modifier.padding(horizontal = NewAppTheme.spacing.`4`)
  ) {
    Box(modifier = Modifier.padding(vertical = NewAppTheme.spacing.`4`)) {
      AppHeader(onProfileClick = onProfileClick)
    }

    if (needToSignIn) {
      NeedToSingInComponent(onProfileClick)
      return@Column
    }

    Spacer(NewAppTheme.spacing.`4`)

    Column {
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

      LazyColumn(
        state = lazyListState,
        verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`2`)
      ) {
        items(items = branches) { branch ->
          RoundedSurface(
            color = NewAppTheme.colors.background.subtle,
            borderRadius = NewAppTheme.borderRadius.xl
          ) {
            Column(
              verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`2`),
              modifier = Modifier
                .clickable {
                  onAction(BranchesAction.OpenBranch(branch.name))
                }
                .padding(NewAppTheme.spacing.`3`)
            ) {
              Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier
                  .fillMaxWidth()
              ) {
                BranchBadge(branch.name)

                LauncherIcons.Chevron(
                  size = 20.dp,
                  tint = NewAppTheme.colors.icon.quaternary
                )
              }

              val update = branch.compatibleUpdate
              if (update == null) {
                Row(
                  horizontalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`2`),
                  verticalAlignment = Alignment.CenterVertically,
                  modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(NewAppTheme.borderRadius.md))
                    .background(NewAppTheme.colors.background.warning)
                    .padding(NewAppTheme.spacing.`2`)
                ) {
                  MenuIcons.Warning(
                    size = 20.dp,
                    tint = NewAppTheme.colors.icon.warning
                  )

                  NewText(
                    "No compatible update found for this branch.",
                    color = NewAppTheme.colors.text.warning,
                    style = NewAppTheme.font.sm.merge(
                      fontWeight = FontWeight.Medium
                    )
                  )
                }
              } else {
                val formatedTime = DateFormat.formatUpdateDate(update.createdAt)

                Row(
                  verticalAlignment = Alignment.CenterVertically,
                  horizontalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`2`)
                ) {
                  LauncherIcons.Updates(
                    size = 20.dp,
                    tint = NewAppTheme.colors.icon.quaternary
                  )

                  Column(
                    verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`1`),
                    modifier = Modifier.padding(end = 20.dp)
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
                  }
                }
              }
            }
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
        } else if (branches.isEmpty()) {
          item {
            Row(
              modifier = Modifier
                .fillMaxWidth()
                .padding(NewAppTheme.spacing.`3`),
              horizontalArrangement = Arrangement.Center,
              verticalAlignment = Alignment.CenterVertically
            ) {
              NewText(
                "No branches available.",
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

@Preview(showBackground = true)
@Composable
fun BranchesScreenPreview() {
  DefaultScreenContainer {
    BranchesScreen(
      isLoading = false,
      needToSignIn = false,
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
}
