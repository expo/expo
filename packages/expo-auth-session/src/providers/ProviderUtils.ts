export function applyRequiredScopes(scopes: string[] = [], requiredScopes: string[]): string[] {
  // Add the required scopes for returning profile data.
  // Remove duplicates
  return [...new Set([...scopes, ...requiredScopes])];
}

export function invariantClientId(idName: string, value: any, providerName: string): asserts value {
  if (typeof value === 'undefined')
    // TODO(Bacon): Add learn more
    throw new Error(
      `Client Id property \`${idName}\` must be defined to use ${providerName} auth on this platform.`
    );
}
