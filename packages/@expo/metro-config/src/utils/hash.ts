import crypto from 'crypto';

export function hashString(str: string) {
  return crypto.createHash('md5').update(str).digest('hex');
}
