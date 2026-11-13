---
'expo': patch
'expo-dev-launcher': patch
---

[iOS] Connect to the development server's `/message` socket and network inspector on port 443 when the bundle URL is `https` with no port, such as an `expo start --tunnel` URL. Before, both used Metro's default port 8081 and never connected, so pressing `r` in the terminal did not reload the app.
