export function domainify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function randomIdentifier(length: number = 6): string {
  const alphabet = '23456789qwertyuipasdfghjkzxcvbnm';
  let result = '';
  for (let i = 0; i < length; i++) {
    const j = Math.floor(Math.random() * alphabet.length);
    const c = alphabet.substr(j, 1);
    result += c;
  }
  return result;
}

export function someRandomness(): string {
  return [randomIdentifier(2), randomIdentifier(3)].join('-');
}
