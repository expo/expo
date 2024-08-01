import {
  convertCertificatePEMToCertificate,
  convertKeyPairToPEM,
  convertCSRToCSRPEM,
  generateKeyPair,
  generateCSR,
  convertPrivateKeyPEMToPrivateKey,
  validateSelfSignedCertificate,
  signBufferRSASHA256AndVerify,
} from '@expo/code-signing-certificates';
import { ExpoConfig } from '@expo/config';
import { getExpoHomeDirectory } from '@expo/config/build/getUserState';
import JsonFile, { JSONObject } from '@expo/json-file';
import { CombinedError } from '@urql/core';
import { promises as fs } from 'fs';
import { GraphQLError } from 'graphql';
import { pki as PKI } from 'node-forge';
import path from 'path';
import { Dictionary, parseDictionary } from 'structured-headers';

import { env } from './env';
import { CommandError } from './errors';
import { getExpoGoIntermediateCertificateAsync } from '../api/getExpoGoIntermediateCertificate';
import { getProjectDevelopmentCertificateAsync } from '../api/getProjectDevelopmentCertificate';
import { AppQuery } from '../api/graphql/queries/AppQuery';
import { ensureLoggedInAsync } from '../api/user/actions';
import { Actor } from '../api/user/user';
import { AppByIdQuery, Permission } from '../graphql/generated';
import * as Log from '../log';
import { learnMore } from '../utils/link';

const debug = require('debug')('expo:codesigning') as typeof console.log;

export type CodeSigningInfo = {
  keyId: string;
  privateKey: string;
  certificateForPrivateKey: string;
  /**
   * Chain of certificates to serve in the manifest multipart body "certificate_chain" part.
   * The leaf certificate must be the 0th element of the array, followed by any intermediate certificates
   * necessary to evaluate the chain of trust ending in the implicitly trusted root certificate embedded in
   * the client.
   *
   * An empty array indicates that there is no need to serve the certificate chain in the multipart response.
   */
  certificateChainForResponse: string[];
  /**
   * Scope key cached for the project when certificate is development Expo Go code signing.
   * For project-specific code signing (keyId == the project's generated keyId) this is undefined.
   */
  scopeKey: string | null;
};

type StoredDevelopmentExpoRootCodeSigningInfo = {
  easProjectId: string | null;
  scopeKey: string | null;
  privateKey: string | null;
  certificateChain: string[] | null;
};
const DEVELOPMENT_CODE_SIGNING_SETTINGS_FILE_NAME = 'development-code-signing-settings-2.json';

export function getDevelopmentCodeSigningDirectory(): string {
  return path.join(getExpoHomeDirectory(), 'codesigning');
}

function getProjectDevelopmentCodeSigningInfoFile<T extends JSONObject>(defaults: T) {
  function getFile(easProjectId: string): JsonFile<T> {
    const filePath = path.join(
      getDevelopmentCodeSigningDirectory(),
      easProjectId,
      DEVELOPMENT_CODE_SIGNING_SETTINGS_FILE_NAME
    );
    return new JsonFile<T>(filePath);
  }

  async function readAsync(easProjectId: string): Promise<T> {
    let projectSettings;
    try {
      projectSettings = await getFile(easProjectId).readAsync();
    } catch {
      projectSettings = await getFile(easProjectId).writeAsync(defaults, { ensureDir: true });
    }
    // Set defaults for any missing fields
    return { ...defaults, ...projectSettings };
  }

  async function setAsync(easProjectId: string, json: Partial<T>): Promise<T> {
    try {
      return await getFile(easProjectId).mergeAsync(json, {
        cantReadFileDefault: defaults,
      });
    } catch {
      return await getFile(easProjectId).writeAsync(
        {
          ...defaults,
          ...json,
        },
        { ensureDir: true }
      );
    }
  }

  return {
    getFile,
    readAsync,
    setAsync,
  };
}

export const DevelopmentCodeSigningInfoFile =
  getProjectDevelopmentCodeSigningInfoFile<StoredDevelopmentExpoRootCodeSigningInfo>({
    easProjectId: null,
    scopeKey: null,
    privateKey: null,
    certificateChain: null,
  });

/**
 * Get info necessary to generate a response `expo-signature` header given a project and incoming request `expo-expect-signature` header.
 * This only knows how to serve two code signing keyids:
 * - `expo-root` indicates that it should use a development certificate in the `expo-root` chain. See {@link getExpoRootDevelopmentCodeSigningInfoAsync}
 * - <developer's expo-updates keyid> indicates that it should sign with the configured certificate. See {@link getProjectCodeSigningCertificateAsync}
 */
export async function getCodeSigningInfoAsync(
  exp: ExpoConfig,
  expectSignatureHeader: string | null,
  privateKeyPath: string | undefined
): Promise<CodeSigningInfo | null> {
  if (!expectSignatureHeader) {
    return null;
  }

  let parsedExpectSignature: Dictionary;
  try {
    parsedExpectSignature = parseDictionary(expectSignatureHeader);
  } catch {
    throw new CommandError('Invalid value for expo-expect-signature header');
  }

  const expectedKeyIdOuter = parsedExpectSignature.get('keyid');
  if (!expectedKeyIdOuter) {
    throw new CommandError('keyid not present in expo-expect-signature header');
  }

  const expectedKeyId = expectedKeyIdOuter[0];
  if (typeof expectedKeyId !== 'string') {
    throw new CommandError(
      `Invalid value for keyid in expo-expect-signature header: ${expectedKeyId}`
    );
  }

  let expectedAlg: string | null = null;
  const expectedAlgOuter = parsedExpectSignature.get('alg');
  if (expectedAlgOuter) {
    const expectedAlgTemp = expectedAlgOuter[0];
    if (typeof expectedAlgTemp !== 'string') {
      throw new CommandError('Invalid value for alg in expo-expect-signature header');
    }
    expectedAlg = expectedAlgTemp;
  }

  if (expectedKeyId === 'expo-root') {
    return await getExpoRootDevelopmentCodeSigningInfoAsync(exp);
  } else if (expectedKeyId === 'expo-go') {
    throw new CommandError(
      'Invalid certificate requested: cannot sign with embedded keyid=expo-go key'
    );
  } else {
    return await getProjectCodeSigningCertificateAsync(
      exp,
      privateKeyPath,
      expectedKeyId,
      expectedAlg
    );
  }
}

/**
 * Get a development code signing certificate for the expo-root -> expo-go -> (development certificate) certificate chain.
 * This requires the user be logged in and online, otherwise try to use the cached development certificate.
 */
async function getExpoRootDevelopmentCodeSigningInfoAsync(
  exp: ExpoConfig
): Promise<CodeSigningInfo | null> {
  const easProjectId = exp.extra?.eas?.projectId;
  // can't check for scope key validity since scope key is derived on the server from projectId and we may be offline.
  // we rely upon the client certificate check to validate the scope key
  if (!easProjectId) {
    debug(
      `WARN: Expo Application Services (EAS) is not configured for your project. Configuring EAS enables a more secure development experience amongst many other benefits. ${learnMore(
        'https://docs.expo.dev/eas/'
      )}`
    );
    return null;
  }

  const developmentCodeSigningInfoFromFile =
    await DevelopmentCodeSigningInfoFile.readAsync(easProjectId);
  const validatedCodeSigningInfo = validateStoredDevelopmentExpoRootCertificateCodeSigningInfo(
    developmentCodeSigningInfoFromFile,
    easProjectId
  );

  // 1. If online, ensure logged in, generate key pair and CSR, fetch and cache certificate chain for projectId
  //    (overwriting existing dev cert in case projectId changed or it has expired)
  if (!env.EXPO_OFFLINE) {
    try {
      return await fetchAndCacheNewDevelopmentCodeSigningInfoAsync(easProjectId);
    } catch (e: any) {
      if (validatedCodeSigningInfo) {
        Log.warn(
          'There was an error fetching the Expo development certificate, falling back to cached certificate'
        );
        return validatedCodeSigningInfo;
      } else {
        // need to return null here and say a message
        throw e;
      }
    }
  }

  // 2. check for cached cert/private key matching projectId and scopeKey of project, if found and valid return private key and cert chain including expo-go cert
  if (validatedCodeSigningInfo) {
    return validatedCodeSigningInfo;
  }

  // 3. if offline, return null
  Log.warn('Offline and no cached development certificate found, unable to sign manifest');
  return null;
}

/**
 * Get the certificate configured for expo-updates for this project.
 */
async function getProjectCodeSigningCertificateAsync(
  exp: ExpoConfig,
  privateKeyPath: string | undefined,
  expectedKeyId: string,
  expectedAlg: string | null
): Promise<CodeSigningInfo | null> {
  const codeSigningCertificatePath = exp.updates?.codeSigningCertificate;
  if (!codeSigningCertificatePath) {
    return null;
  }

  if (!privateKeyPath) {
    throw new CommandError(
      'Must specify --private-key-path argument to sign development manifest for requested code signing key'
    );
  }

  const codeSigningMetadata = exp.updates?.codeSigningMetadata;
  if (!codeSigningMetadata) {
    throw new CommandError(
      'Must specify "codeSigningMetadata" under the "updates" field of your app config file to use EAS code signing'
    );
  }

  const { alg, keyid } = codeSigningMetadata;
  if (!alg || !keyid) {
    throw new CommandError(
      'Must specify "keyid" and "alg" in the "codeSigningMetadata" field under the "updates" field of your app config file to use EAS code signing'
    );
  }

  if (expectedKeyId !== keyid) {
    throw new CommandError(`keyid mismatch: client=${expectedKeyId}, project=${keyid}`);
  }

  if (expectedAlg && expectedAlg !== alg) {
    throw new CommandError(`"alg" field mismatch (client=${expectedAlg}, project=${alg})`);
  }

  const { privateKeyPEM, certificatePEM } =
    await getProjectPrivateKeyAndCertificateFromFilePathsAsync({
      codeSigningCertificatePath,
      privateKeyPath,
    });

  return {
    keyId: keyid,
    privateKey: privateKeyPEM,
    certificateForPrivateKey: certificatePEM,
    certificateChainForResponse: [],
    scopeKey: null,
  };
}

async function readFileWithErrorAsync(path: string, errorMessage: string): Promise<string> {
  try {
    return await fs.readFile(path, 'utf8');
  } catch {
    throw new CommandError(errorMessage);
  }
}

async function getProjectPrivateKeyAndCertificateFromFilePathsAsync({
  codeSigningCertificatePath,
  privateKeyPath,
}: {
  codeSigningCertificatePath: string;
  privateKeyPath: string;
}): Promise<{ privateKeyPEM: string; certificatePEM: string }> {
  const [codeSigningCertificatePEM, privateKeyPEM] = await Promise.all([
    readFileWithErrorAsync(
      codeSigningCertificatePath,
      `Code signing certificate cannot be read from path: ${codeSigningCertificatePath}`
    ),
    readFileWithErrorAsync(
      privateKeyPath,
      `Code signing private key cannot be read from path: ${privateKeyPath}`
    ),
  ]);

  const privateKey = convertPrivateKeyPEMToPrivateKey(privateKeyPEM);
  const certificate = convertCertificatePEMToCertificate(codeSigningCertificatePEM);
  validateSelfSignedCertificate(certificate, {
    publicKey: certificate.publicKey as PKI.rsa.PublicKey,
    privateKey,
  });

  return { privateKeyPEM, certificatePEM: codeSigningCertificatePEM };
}

/**
 * Validate that the cached code signing info is still valid for the current project and
 * that it hasn't expired. If invalid, return null.
 */
function validateStoredDevelopmentExpoRootCertificateCodeSigningInfo(
  codeSigningInfo: StoredDevelopmentExpoRootCodeSigningInfo,
  easProjectId: string
): CodeSigningInfo | null {
  if (codeSigningInfo.easProjectId !== easProjectId) {
    return null;
  }

  const {
    privateKey: privateKeyPEM,
    certificateChain: certificatePEMs,
    scopeKey,
  } = codeSigningInfo;
  if (!privateKeyPEM || !certificatePEMs) {
    return null;
  }

  const certificateChain = certificatePEMs.map((certificatePEM) =>
    convertCertificatePEMToCertificate(certificatePEM)
  );

  // TODO(wschurman): maybe move to @expo/code-signing-certificates

  // ensure all intermediate certificates are valid
  for (const certificate of certificateChain) {
    const now = new Date();
    if (certificate.validity.notBefore > now || certificate.validity.notAfter < now) {
      return null;
    }
  }

  // TODO(wschurman): maybe do more validation, like validation of projectID and scopeKey within eas certificate extension

  return {
    keyId: 'expo-go',
    certificateChainForResponse: certificatePEMs,
    certificateForPrivateKey: certificatePEMs[0],
    privateKey: privateKeyPEM,
    scopeKey,
  };
}

function actorCanGetProjectDevelopmentCertificate(actor: Actor, app: AppByIdQuery['app']['byId']) {
  const owningAccountId = app.ownerAccount.id;

  const owningAccountIsActorPrimaryAccount =
    actor.__typename === 'User' || actor.__typename === 'SSOUser'
      ? actor.primaryAccount.id === owningAccountId
      : false;
  const userHasPublishPermissionForOwningAccount = !!actor.accounts
    .find((account) => account.id === owningAccountId)
    ?.users?.find((userPermission) => userPermission.actor.id === actor.id)
    ?.permissions?.includes(Permission.Publish);
  return owningAccountIsActorPrimaryAccount || userHasPublishPermissionForOwningAccount;
}

async function fetchAndCacheNewDevelopmentCodeSigningInfoAsync(
  easProjectId: string
): Promise<CodeSigningInfo | null> {
  const actor = await ensureLoggedInAsync();
  let app: AppByIdQuery['app']['byId'];
  try {
    app = await AppQuery.byIdAsync(easProjectId);
  } catch (e) {
    if (e instanceof GraphQLError || e instanceof CombinedError) {
      return null;
    }
    throw e;
  }
  if (!actorCanGetProjectDevelopmentCertificate(actor, app)) {
    return null;
  }

  const keyPair = generateKeyPair();
  const keyPairPEM = convertKeyPairToPEM(keyPair);
  const csr = generateCSR(keyPair, `Development Certificate for ${easProjectId}`);
  const csrPEM = convertCSRToCSRPEM(csr);
  const [developmentSigningCertificate, expoGoIntermediateCertificate] = await Promise.all([
    getProjectDevelopmentCertificateAsync(easProjectId, csrPEM),
    getExpoGoIntermediateCertificateAsync(easProjectId),
  ]);

  await DevelopmentCodeSigningInfoFile.setAsync(easProjectId, {
    easProjectId,
    scopeKey: app.scopeKey,
    privateKey: keyPairPEM.privateKeyPEM,
    certificateChain: [developmentSigningCertificate, expoGoIntermediateCertificate],
  });

  return {
    keyId: 'expo-go',
    certificateChainForResponse: [developmentSigningCertificate, expoGoIntermediateCertificate],
    certificateForPrivateKey: developmentSigningCertificate,
    privateKey: keyPairPEM.privateKeyPEM,
    scopeKey: app.scopeKey,
  };
}
/**
 * Generate the `expo-signature` header for a manifest and code signing info.
 */
export function signManifestString(
  stringifiedManifest: string,
  codeSigningInfo: CodeSigningInfo
): string {
  const privateKey = convertPrivateKeyPEMToPrivateKey(codeSigningInfo.privateKey);
  const certificate = convertCertificatePEMToCertificate(codeSigningInfo.certificateForPrivateKey);
  return signBufferRSASHA256AndVerify(
    privateKey,
    certificate,
    Buffer.from(stringifiedManifest, 'utf8')
  );
}
