export function formatUpdateUrl(permalink: string, message: string) {
  const updatePermalinkQuery = `url=${encodeURIComponent(permalink)}`;
  const updateMessageQuery = `updateMessage=${encodeURIComponent(message)}`;
  const updateUrl = `expo-dev-client://expo-development-client?${updatePermalinkQuery}&${updateMessageQuery}`;
  return updateUrl;
}
