import { fetchAsync } from './rest/client';
import { CommandError } from '../utils/errors';

export async function getExpoGoIntermediateCertificateAsync(easProjectId: string): Promise<string> {
  const response = await fetchAsync(
    `projects/${encodeURIComponent(
      easProjectId
    )}/development-certificates/expo-go-intermediate-certificate`,
    {
      method: 'GET',
    }
  );
  if (!response.ok) {
    throw new CommandError('API', `Unexpected error from Expo servers: ${response.statusText}.`);
  }
  const buffer = await response.buffer();
  return buffer.toString('utf8');
}
