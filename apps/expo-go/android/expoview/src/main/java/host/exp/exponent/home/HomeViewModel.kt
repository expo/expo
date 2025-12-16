package host.exp.exponent.home

import androidx.activity.result.launch
import androidx.compose.foundation.layout.add
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable

// Enums to match the TypeScript union types
enum class DevSessionPlatform {
    Native, Web
}

enum class DevSessionSource {
    Desktop, Snack
}

// The Data Class representing the TypeScript type
data class DevSession(
    val description: String,
    val url: String,
    val source: DevSessionSource,
    val hostname: String? = null,
    // 'object' in TS is best represented as a Map or a generic JSON element in Kotlin
    val config: Map<String, Any>? = null,
    val platform: DevSessionPlatform? = null
)

data class Account(
    val username: String,
    val profilePictureUrl: String?,
    val email: String
)

class HomeViewModel: ViewModel() {
    // internal mutable state
    val sessions = MutableStateFlow<List<DevSession>>(emptyList())
    val recents = MutableStateFlow<List<DevSession>>(emptyList())
    val apps = MutableStateFlow<List<DevSession>>(emptyList())
    val snacks = MutableStateFlow<List<DevSession>>(emptyList())
    val account = MutableStateFlow<Account?>(null)

    init {
        // Load initial data (mocking a network call or local storage retrieval)
        loadSessions()
    }

    private fun loadSessions() {
        viewModelScope.launch {
            // Simulate fetching data
            val mockSessions = listOf(
                DevSession(
                    description = "My First Project",
                    url = "exp://192.168.1.5:8081",
                    source = DevSessionSource.Desktop,
                    platform = DevSessionPlatform.Native,
                    hostname = "macbook-pro.local"
                ),
                DevSession(
                    description = "Cool Snack",
                    url = "exp://exp.host/@snack/sdk.49.0.0",
                    source = DevSessionSource.Snack,
                    platform = DevSessionPlatform.Web
                ),
                DevSession(
                    description = "Cool Snack",
                    url = "exp://exp.host/@snack/sdk.49.0.0",
                    source = DevSessionSource.Snack,
                    platform = DevSessionPlatform.Web
                ),
                DevSession(
                    description = "Cool Snack",
                    url = "exp://exp.host/@snack/sdk.49.0.0",
                    source = DevSessionSource.Snack,
                    platform = DevSessionPlatform.Web
                ),
                DevSession(
                    description = "Cool Snack",
                    url = "exp://exp.host/@snack/sdk.49.0.0",
                    source = DevSessionSource.Snack,
                    platform = DevSessionPlatform.Web
                )
            )
            sessions.value = mockSessions
            recents.value = mockSessions.take(1)
            apps.value = mockSessions// Just an example
        }
    }

    fun addSession(session: DevSession) {
        val currentList = sessions.value.toMutableList()
        currentList.add(session)
        sessions.value = currentList
    }

    fun login(username: String) {
        account.value = Account(username, "https://picsum.photos/200/200", "test@test.com")
    }

    fun logout() {
        account.value = null
    }

    fun removeSession(url: String) {
        sessions.value = sessions.value.filter { it.url != url }
    }

    fun clearRecents() {
        recents.value = emptyList()
    }
}