import fetch from 'node-fetch';

export async function getSchemaAsync(sdkVersion: string): Promise<any> {
  const result = await fetch(
    new URL(
      `/--/api/v2/project/configuration/schema/${sdkVersion}`,
      getExpoHostApiBaseUrl()
    ).toString()
  );
  const resultJson = await result.json();
  return resultJson.data.schema;
}

function getExpoHostApiBaseUrl(): string {
  if (process.env.EXPO_STAGING) {
    return `https://staging.exp.host`;
  } else {
    return `https://exp.host`;
  }
}
