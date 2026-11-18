---
'expo': patch
'expo-dev-launcher': patch
---

[iOS] Connect to the development server's `/message` socket and network inspector on port 443 when the bundle URL is `https` with no port, such as an `expo start --tunnel` URL.
