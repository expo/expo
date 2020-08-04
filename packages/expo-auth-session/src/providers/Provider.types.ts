import { AuthRequestConfig } from '../AuthSession';

export interface ProviderAuthRequestConfig extends AuthRequestConfig {
  /**
   * Language for the sign in UI, in the form of ISO 639-1 language code optionally followed by a dash
   * and ISO 3166-1 alpha-2 region code, such as 'it' or 'pt-PT'.
   * Only set this value if it's different from the system default (which you can access via expo-localization).
   */
  language?: string;
}
