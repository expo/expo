package host.exp.exponent.home

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import host.exp.exponent.graphql.BranchesForProjectQuery

@OptIn(ExperimentalMaterial3ExpressiveApi::class)
@Composable
fun BranchRow(
  branch: BranchesForProjectQuery.UpdateBranch,
  onClick: () -> Unit
) {
  Row(
    modifier = Modifier
      .fillMaxWidth()
      .clickable { onClick() }
      .padding(16.dp),
    verticalAlignment = Alignment.CenterVertically
  ) {
//         TODO: Add icons for branch and update
    val lastUpdate = branch.updates.lastOrNull()
    Column(modifier = Modifier.weight(1f)) {
      Text(
        text = "Branch: " + branch.name,
        // You might want to make the branch name more prominent
        style = MaterialTheme.typography.bodyLarge,
        fontWeight = FontWeight.Medium,
        modifier = Modifier.padding(bottom = 6.dp)
      )
      // If a last update exists, display it using the new UpdateRow composable
      if (lastUpdate != null) {
        UpdateRow(update = lastUpdate, omitCompatibility = true)
      }
    }
  }
}
