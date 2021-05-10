package expo.modules.devmenu.constants

import android.net.Uri

private const val origin = "https://exp.host"

internal const val AuthHeader = "expo-session"
internal val GraphQLEndpoint = Uri.parse("$origin/--/graphql")
internal val RESTEndpoint = Uri.parse("$origin/--/api/v2/")
