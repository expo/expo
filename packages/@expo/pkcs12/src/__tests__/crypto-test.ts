import { AsnSerializer, OctetString } from '@peculiar/asn1-schema';
import { AlgorithmIdentifier } from '@peculiar/asn1-x509';
import { createCipheriv, pbkdf2Sync } from 'crypto';

import { decrypt, KdfBudget } from '../crypto';
import { PBES2Parameters, PBKDF2Parameters } from '../schema';

it.each(['password', 'pässΩ'])(
  'reads the legacy SHA-224 PBES2 encoding with %s',
  async (password) => {
    const salt = Buffer.alloc(16, 1);
    const iv = Buffer.alloc(16, 2);
    const plaintext = Buffer.from('Synthetic private-key plaintext');
    const key = pbkdf2Sync(Buffer.from(password, 'latin1'), salt, 2, 32, 'sha512-224');
    const cipher = createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const kdf = Object.assign(new PBKDF2Parameters(), {
      salt: salt.buffer,
      iterationCount: 2,
      prf: new AlgorithmIdentifier({ algorithm: '1.2.840.113549.2.8' }),
    });
    const params = Object.assign(new PBES2Parameters(), {
      keyDerivationFunc: new AlgorithmIdentifier({
        algorithm: '1.2.840.113549.1.5.12',
        parameters: AsnSerializer.serialize(kdf),
      }),
      encryptionScheme: new AlgorithmIdentifier({
        algorithm: '2.16.840.1.101.3.4.1.42',
        parameters: AsnSerializer.serialize(new OctetString(iv)),
      }),
    });
    const identifier = new AlgorithmIdentifier({
      algorithm: '1.2.840.113549.1.5.13',
      parameters: AsnSerializer.serialize(params),
    });
    const decrypted = await decrypt(identifier, encrypted, password, new KdfBudget(), (bytes) => {
      if (!bytes.equals(plaintext)) throw new Error('Invalid decrypted plaintext');
    });
    expect(decrypted).toEqual(plaintext);
  }
);
