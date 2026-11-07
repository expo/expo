import type { MacData } from '@peculiar/asn1-pfx';
import type { AlgorithmIdentifier } from '@peculiar/asn1-x509';
import { OctetString } from 'asn1js';
import { createDecipheriv, createHash, createHmac, pbkdf2, timingSafeEqual } from 'crypto';
import { setImmediate } from 'timers/promises';
import { promisify } from 'util';

import { decode, parse, PBEParameters, PBES2Parameters, PBKDF2Parameters } from './schema';

const derivePBKDF2 = promisify(pbkdf2);

const pbes2Ciphers: Record<string, [string, number]> = {
  '2.16.840.1.101.3.4.1.2': ['aes-128-cbc', 16],
  '2.16.840.1.101.3.4.1.22': ['aes-192-cbc', 24],
  '2.16.840.1.101.3.4.1.42': ['aes-256-cbc', 32],
  '1.2.840.113549.3.7': ['des-ede3-cbc', 24],
  '1.3.14.3.2.7': ['des-cbc', 8],
};
const pbkdf2Hashes: Record<string, string> = {
  '1.2.840.113549.2.7': 'sha1',
  '1.2.840.113549.2.8': 'sha224',
  '1.2.840.113549.2.9': 'sha256',
  '1.2.840.113549.2.10': 'sha384',
  '1.2.840.113549.2.11': 'sha512',
};
const legacyCiphers: Record<string, [string, number, number]> = {
  '1.2.840.113549.1.12.1.3': ['des-ede3-cbc', 24, 8],
  '1.2.840.113549.1.12.1.6': ['rc2-40-cbc', 5, 8],
};
const macHashes: Record<string, string> = {
  '1.3.14.3.2.26': 'sha1',
  '2.16.840.1.101.3.4.2.4': 'sha224',
  '2.16.840.1.101.3.4.2.1': 'sha256',
  '2.16.840.1.101.3.4.2.2': 'sha384',
  '2.16.840.1.101.3.4.2.3': 'sha512',
  '1.2.840.113549.2.5': 'md5',
};

export class LegacyProviderRequired extends Error {}

export class DecryptionError extends Error {}

export class KdfBudget {
  private remaining = 10000000;

  consume(iterations: number) {
    this.remaining -= iterations;
    if (this.remaining < 0)
      throw new Error('PKCS12: container exceeds the aggregate KDF work limit');
  }
}

export function checkIterations(iterations: number) {
  if (!Number.isSafeInteger(iterations) || iterations < 1 || iterations > 1000000) {
    throw new Error('PKCS12: iteration count must be between 1 and 1000000');
  }
}

// PKCS12 requires RFC 7292 B.2 derivation
export async function derivePKCS12Key(
  password: string,
  salt: Buffer,
  iterations: number,
  purpose: number,
  length: number,
  algorithm: string,
  budget: KdfBudget
): Promise<Buffer> {
  checkIterations(iterations);
  const digestSize = createHash(algorithm).digest().length;
  budget.consume(iterations * Math.ceil(length / digestSize));
  const blockSize = algorithm === 'sha384' || algorithm === 'sha512' ? 128 : 64;
  // PKCS12 requires a terminator even for an empty password
  const encodedPassword = Buffer.from(`${password}\0`, 'utf16le').swap16();
  const expand = (bytes: Buffer) =>
    Buffer.alloc(Math.ceil(bytes.length / blockSize) * blockSize, bytes);
  const input = Buffer.concat([expand(salt), expand(encodedPassword)]);
  const diversifier = Buffer.alloc(blockSize, purpose);
  const output = Buffer.alloc(length);
  for (let outputOffset = 0; outputOffset < length; outputOffset += digestSize) {
    let digest = createHash(algorithm).update(diversifier).update(input).digest();
    // Yield to keep the event loop responsive
    for (let round = 1; round < iterations; round++) {
      if (round % 2048 === 0) await setImmediate();
      digest = createHash(algorithm).update(digest).digest();
    }
    digest.copy(output, outputOffset);
    addToPKCS12Blocks(input, Buffer.alloc(blockSize, digest));
  }
  return output;
}

function addToPKCS12Blocks(input: Buffer, block: Buffer): void {
  for (let offset = 0; offset < input.length; offset += block.length) {
    // RFC 7292 requires adding B + 1 to each block
    let carry = 1;
    for (let i = block.length - 1; i >= 0; i--) {
      carry += input[offset + i]! + block[i]!;
      input[offset + i] = carry & 255;
      carry >>>= 8;
    }
  }
}

export function checkLegacyCipher(oid: string): void {
  const cipher = legacyCiphers[oid];
  if (!cipher) return;
  const [algorithm, keyLength, ivLength] = cipher;
  try {
    createDecipheriv(algorithm, Buffer.alloc(keyLength), Buffer.alloc(ivLength));
  } catch {
    throw new LegacyProviderRequired(
      `PKCS12: legacy cipher ${algorithm} requires OpenSSL's legacy provider`
    );
  }
}

export async function decrypt(
  identifier: AlgorithmIdentifier,
  encrypted: Buffer,
  password: string,
  budget: KdfBudget,
  validate?: (plaintext: Buffer) => void
): Promise<Buffer> {
  const oid = identifier.algorithm;
  if (!identifier.parameters) throw new Error(`PKCS12: missing parameters for ${oid}`);
  if (oid === '1.2.840.113549.1.5.13') {
    return decryptPBES2(
      parse(identifier.parameters, PBES2Parameters),
      encrypted,
      password,
      budget,
      validate
    );
  }
  const cipher = legacyCiphers[oid];
  if (!cipher) throw new Error(`PKCS12: unsupported encryption algorithm ${oid}`);
  const [algorithm, keyLength, ivLength] = cipher;
  checkLegacyCipher(oid);
  const params = parse(identifier.parameters, PBEParameters);
  const salt = Buffer.from(params.salt);
  const derive = (purpose: number, length: number) =>
    derivePKCS12Key(password, salt, params.iterations, purpose, length, 'sha1', budget);
  const key = await derive(1, keyLength);
  const iv = await derive(2, ivLength);
  return decryptWithKey(algorithm, key, iv, encrypted, validate);
}

async function decryptPBES2(
  params: PBES2Parameters,
  encrypted: Buffer,
  password: string,
  budget: KdfBudget,
  validate?: (plaintext: Buffer) => void
): Promise<Buffer> {
  if (params.keyDerivationFunc.algorithm !== '1.2.840.113549.1.5.12') {
    throw new Error('PKCS12: unsupported PBES2 key derivation algorithm');
  }
  if (!params.keyDerivationFunc.parameters || !params.encryptionScheme.parameters) {
    throw new Error('PKCS12: missing PBES2 parameters');
  }
  const kdf = parse(params.keyDerivationFunc.parameters, PBKDF2Parameters);
  checkIterations(kdf.iterationCount);
  const cipher = pbes2Ciphers[params.encryptionScheme.algorithm];
  const hash = pbkdf2Hashes[kdf.prf.algorithm];
  if (!cipher || !hash || (kdf.keyLength !== undefined && kdf.keyLength !== cipher[1])) {
    throw new Error('PKCS12: unsupported PBES2 cipher, PRF, or key length');
  }
  const [algorithm, keyLength] = cipher;
  const ivNode = decode(params.encryptionScheme.parameters);
  if (!(ivNode instanceof OctetString)) throw new Error('PKCS12: invalid cipher IV');
  const iv = Buffer.from(ivNode.getValue());
  const salt = Buffer.from(kdf.salt);
  const passwords = [Buffer.from(password, 'utf8')];
  if (/[^\x00-\x7f]/.test(password)) passwords.push(Buffer.from(password, 'latin1'));
  // Some containers use the SHA-224 OID for SHA-512/224
  const digests = hash === 'sha224' ? [hash, 'sha512-224'] : [hash];
  let failure: unknown;
  for (const digest of digests) {
    for (const encodedPassword of passwords) {
      // Count each retry to bound the total work
      budget.consume(
        kdf.iterationCount * Math.ceil(keyLength / createHash(digest).digest().length)
      );
      const key = await derivePBKDF2(encodedPassword, salt, kdf.iterationCount, keyLength, digest);
      try {
        return decryptWithKey(algorithm, key, iv, encrypted, validate);
      } catch (error) {
        if (error instanceof LegacyProviderRequired) throw error;
        failure = error;
      }
    }
  }
  throw failure;
}

function decryptWithKey(
  algorithm: string,
  key: Buffer,
  iv: Buffer | null,
  encrypted: Buffer,
  validate?: (plaintext: Buffer) => void
): Buffer {
  try {
    const decipher = createDecipheriv(algorithm, key, iv);
    const plaintext = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    // Valid padding does not prove a correct password
    validate?.(plaintext);
    return plaintext;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ERR_OSSL_EVP_UNSUPPORTED' || code === 'ERR_CRYPTO_UNKNOWN_CIPHER') {
      throw new LegacyProviderRequired(
        `PKCS12: cipher ${algorithm} requires OpenSSL's legacy provider`
      );
    }
    throw new DecryptionError(error instanceof Error ? error.message : String(error));
  }
}

export async function verifyMac(
  bytes: Buffer,
  mac: MacData,
  password: string,
  budget: KdfBudget
): Promise<void> {
  const hash = macHashes[mac.mac.digestAlgorithm.algorithm];
  if (!hash) throw new Error('PKCS12: unsupported MAC digest algorithm');
  const expected = Buffer.from(mac.mac.digest.buffer);
  const size = createHash(hash).digest().length;
  const key = await derivePKCS12Key(
    password,
    Buffer.from(mac.macSalt.buffer),
    mac.iterations,
    3,
    size,
    hash,
    budget
  );
  const actual = createHmac(hash, key).update(bytes).digest();
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new Error('PKCS#12 MAC could not be verified. Invalid password?');
  }
}
