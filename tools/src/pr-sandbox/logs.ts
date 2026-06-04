const DEFAULT_LOG_LIMIT = 64_000;

const SECRET_ASSIGNMENT_PATTERN =
  /\b(CODEX_API_KEY|OPENAI_API_KEY|GITHUB_TOKEN|GH_TOKEN|CLOUDFLARE_API_TOKEN|CLOUDFLARE_TOKEN|NPM_TOKEN|YARN_NPM_AUTH_TOKEN|BUN_AUTH_TOKEN)\b\s*[:=]\s*['"]?[^'"\s]+['"]?/gi;

export function redactSandboxLogs(input: string): string {
  return input.replace(SECRET_ASSIGNMENT_PATTERN, '$1=[redacted]');
}

export function capSandboxLogs(input: string, limit: number = DEFAULT_LOG_LIMIT): string {
  const redacted = redactSandboxLogs(input);
  if (redacted.length <= limit) {
    return redacted;
  }
  return `${redacted.slice(0, limit)}\n[truncated ${redacted.length - limit} characters]`;
}
