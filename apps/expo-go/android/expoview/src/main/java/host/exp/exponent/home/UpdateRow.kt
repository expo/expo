package host.exp.exponent.home

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import host.exp.exponent.graphql.BranchDetailsQuery
import host.exp.exponent.graphql.BranchesForProjectQuery

// TODO: Add compatiblity check and onclick

/**
 * A composable that displays information about a single update, including its
 * message and publication date.
 */
@Composable
fun UpdateRow(update: BranchesForProjectQuery.Update) {
    Column {
        Text(
            text = update.updateData.message ?: "No message",
            // Apply bodySmall style for secondary text
            style = MaterialTheme.typography.bodySmall,
            fontWeight = FontWeight.Medium,
            // Prevent long messages from taking up too many lines
            maxLines = 2,
            modifier = Modifier.padding(bottom = 4.dp)
        )
        Text(
            text = "Published: " + formatIsoDateTime(update.updateData.createdAt as? String),
            // Apply bodySmall style here as well
            style = MaterialTheme.typography.bodySmall,
        )
    }
}

@Composable
fun UpdateRow(update: BranchDetailsQuery.Update) {
    Column {
        Text(
            text = update.updateData.message ?: "No message",
            // Apply bodySmall style for secondary text
            style = MaterialTheme.typography.bodySmall,
            fontWeight = FontWeight.Medium,
            // Prevent long messages from taking up too many lines
            maxLines = 2,
            modifier = Modifier.padding(bottom = 4.dp)
        )
        Text(
            text = "Published: " + formatIsoDateTime(update.updateData.createdAt as? String),
            // Apply bodySmall style here as well
            style = MaterialTheme.typography.bodySmall,
        )
    }
}