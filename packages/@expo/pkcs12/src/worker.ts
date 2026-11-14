import { LegacyProviderRequired } from './crypto';
import { parseCertificates } from './parser';
import { parseInSubprocess } from './subprocess';

async function main() {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of process.stdin) {
    size += chunk.length;
    // Allow room for Base64 and JSON around the binary container
    if (size > 24 * 1024 * 1024) throw new Error('PKCS12: parser input exceeds the size limit');
    chunks.push(Buffer.from(chunk));
  }
  const { data, password } = JSON.parse(Buffer.concat(chunks).toString('utf8')) as {
    data: string;
    password: string;
  };
  const bytes = Buffer.from(data, 'base64');
  try {
    return await parseCertificates(bytes, password);
  } catch (error) {
    // The flag prevents endless retries
    if (
      error instanceof LegacyProviderRequired &&
      !process.execArgv.includes('--openssl-legacy-provider')
    ) {
      return await parseInSubprocess(bytes, password);
    }
    throw error;
  }
}

main().then(
  (certificates) => process.stdout.write(JSON.stringify({ certificates })),
  (error: unknown) =>
    process.stdout.write(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) })
    )
);
