package expo.modules.brownfield

import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.remember
import androidx.compose.runtime.mutableStateOf

@Composable
fun <T> rememberSharedState(key: String): MutableState<T?> {
    val backingState = remember(key) {
        @Suppress("UNCHECKED_CAST")
        mutableStateOf(BrownfieldState.get(key) as? T)
    }

    DisposableEffect(key) {
        val subscription = BrownfieldState.subscribe(key) { newValue ->
            backingState.value = newValue as? T
        }
        onDispose { subscription.remove() }
    }

    return remember(key) {
        object : MutableState<T?> {
            override var value: T?
                get() = backingState.value
                set(newValue) {
                    if (newValue != null) {
                        BrownfieldState.set(key, newValue)
                    } else {
                        BrownfieldState.delete(key)
                    }
                }

            override fun component1(): T? = value
            override fun component2(): (T?) -> Unit = { value = it }
        }
    }
}