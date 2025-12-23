package host.exp.exponent.home

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage
import host.exp.exponent.graphql.BranchesForProjectQuery
import host.exp.exponent.graphql.Home_AccountAppsQuery
import host.exp.exponent.graphql.ProjectsQuery

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
