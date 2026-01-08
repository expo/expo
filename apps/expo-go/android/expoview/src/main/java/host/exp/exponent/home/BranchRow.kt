package host.exp.exponent.home

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import host.exp.exponent.graphql.BranchesForProjectQuery

@Composable
fun BranchRow(branch: BranchesForProjectQuery.UpdateBranch, onClick: () -> Unit) {
    Row(
        modifier = Modifier
          .fillMaxWidth()
          .clickable { onClick() }
          .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(
                text = branch.name,
            )
        }

        Spacer(modifier = Modifier.width(8.dp))
    }
}
