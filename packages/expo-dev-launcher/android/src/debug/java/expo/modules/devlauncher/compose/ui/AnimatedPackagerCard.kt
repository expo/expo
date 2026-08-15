package expo.modules.devlauncher.compose.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.MutableTransitionState
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import expo.modules.devlauncher.compose.models.HomeAction
import expo.modules.devlauncher.services.PackagerInfo

@Composable
internal fun <T, Key> rememberAnimatedItemsState(
  items: Set<T>,
  key: (T) -> Key
): List<Pair<T, MutableTransitionState<Boolean>>> {
  val allItems = remember { mutableStateMapOf<Key, T>() }
  val visibilityStates = remember { mutableMapOf<Key, MutableTransitionState<Boolean>>() }
  val currentKeys = remember(items) { items.map(key).toSet() }

  items
    .map { key(it) to it }
    .forEach { (key, item) ->
      allItems[key] = item
      visibilityStates.getOrPut(key) { MutableTransitionState(false) }
    }

  allItems
    .keys
    .forEach { k ->
      visibilityStates[k]?.targetState = k in currentKeys
    }

  val staleKeys = visibilityStates
    .entries
    .filter { (_, state) -> !state.targetState && state.isIdle }
    .map { it.key }

  staleKeys.forEach {
    allItems.remove(it)
    visibilityStates.remove(it)
  }

  return allItems.map { (k, item) ->
    item to (visibilityStates[k] ?: MutableTransitionState(true))
  }
}

@Composable
internal fun AnimatedPackagerCard(
  packager: PackagerInfo,
  visibleState: MutableTransitionState<Boolean>,
  onAction: (HomeAction) -> Unit
) {
  AnimatedVisibility(
    visibleState = visibleState,
    enter = expandVertically(
      animationSpec = tween(300),
      expandFrom = Alignment.Top
    ),
    exit = shrinkVertically(
      animationSpec = tween(300),
      shrinkTowards = Alignment.Top
    )
  ) {
    RunningAppCard(
      appIp = packager.url,
      appName = packager.description
    ) {
      onAction(HomeAction.OpenApp(packager.url))
    }
  }
}
