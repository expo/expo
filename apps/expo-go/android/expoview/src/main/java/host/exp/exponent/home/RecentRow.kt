package host.exp.exponent.home

import androidx.compose.runtime.Composable

@Composable
fun RecentRow(historyItem: HistoryItem) {
  /*
     const title =
            (project.manifest && 'extra' in project.manifest
              ? project.manifest.extra?.expoClient?.name
              : undefined) ??
            (project.manifest && 'name' in project.manifest
              ? String(project.manifest.name)
              : undefined);

          const iconUrl =
            project.manifest && 'extra' in project.manifest
              ? // @ts-expect-error iconUrl exists only for local development
                project.manifest?.extra?.expoClient?.iconUrl
              : undefined;
   */
  ClickableItemRow(text = historyItem.url, onClick = {})
}
