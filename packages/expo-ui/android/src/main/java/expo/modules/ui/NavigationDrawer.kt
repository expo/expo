package expo.modules.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.NavigationDrawerItem
import androidx.compose.material3.Text
import androidx.compose.material3.rememberDrawerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import kotlinx.coroutines.launch
import java.io.Serializable

data class NavigationDrawerProps(val enabled: Boolean = false): ComposeProps

open class DrawerStateChangeEvent(
    @Field open val enabled: Boolean = false
) : Record, Serializable

@Composable
fun NavigationDrawer(
    enabled: Boolean,
    onStateChange: (Boolean) -> Unit,
    drawerContent: @Composable ColumnScope.() -> Unit,
    content: @Composable () -> Unit
) {
    val drawerState = rememberDrawerState(
        initialValue = if (enabled) DrawerValue.Open else DrawerValue.Closed
    )

    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(enabled) {


        if (enabled && drawerState.currentValue == DrawerValue.Closed) {
            coroutineScope.launch {
                drawerState.open()
            }
        } else if (!enabled && drawerState.currentValue == DrawerValue.Open) {
            coroutineScope.launch {
                drawerState.close()
            }
        }

    }

    LaunchedEffect(drawerState.currentValue) {
        val isOpen = drawerState.currentValue == DrawerValue.Open
        onStateChange(isOpen)
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet(drawerState = drawerState) {
                //                Column(
                //                    modifier = Modifier.padding(horizontal = 16.dp)
                //                        .verticalScroll(rememberScrollState())
                //                ) {
                drawerContent()
                //                }
            }
        },
        content = content
    )
}