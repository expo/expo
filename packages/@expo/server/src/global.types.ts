import type * as undici from 'undici';

declare global {
  interface RequestInit extends undici.RequestInit {
    duplex?: 'half';
  }
}
