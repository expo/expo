import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import {
  getSwiftFileTypeInformation,
  preprocessSwiftFile,
} from './swift/sourcekittenTypeInformation';
import {
  FileTypeInformation,
  FileTypeInformationSerialized,
  GetFileTypeInformationOptions,
  TypeInferenceOption,
} from './typeInformation.types';
import { taskAll } from './utils';

/**
 * Used for testing purposes, maps Sets and Maps to Arrays and returns `FileTypeInformationSerialized` object which can be written to a JSON.
 * @param fileTypeinformation `FileTypeInformation` object to serialize.
 * @returns a `FileTypeInformationSerialized` object.
 * @header TypeInformationAbstraction
 */
export function serializeTypeInformation({
  usedTypeIdentifiers,
  declaredTypeIdentifiers,
  inferredTypeParametersCount,
  typeIdentifierDefinitionMap,
  moduleClasses,
  records,
  enums,
}: FileTypeInformation): FileTypeInformationSerialized {
  return {
    usedTypeIdentifiersList: [...usedTypeIdentifiers.keys()].sort(),
    declaredTypeIdentifiersList: [...declaredTypeIdentifiers.keys()].sort(),
    inferredTypeParametersCountList: [...inferredTypeParametersCount.entries()].sort(),
    typeIdentifierDefinitionList: [...typeIdentifierDefinitionMap.entries()].sort(),
    moduleClasses,
    records,
    enums,
  };
}

/**
 *  Used for testing purposes, maps Arrays to Sets and Maps depending on the field and returns `FileTypeInformation` object.
 * @param fileTypeinformationSerialized `FileTypeInformationSerialized` object to deserialize.
 * @returns `FileTypeInformation` object.
 * @header TypeInformationAbstraction
 */
export function deserializeTypeInformation({
  usedTypeIdentifiersList,
  declaredTypeIdentifiersList,
  inferredTypeParametersCountList,
  typeIdentifierDefinitionList,
  moduleClasses,
  records,
  enums,
}: FileTypeInformationSerialized): FileTypeInformation {
  return {
    usedTypeIdentifiers: new Set<string>(usedTypeIdentifiersList),
    declaredTypeIdentifiers: new Set<string>(declaredTypeIdentifiersList),
    inferredTypeParametersCount: new Map<string, number>(inferredTypeParametersCountList),
    typeIdentifierDefinitionMap: new Map(typeIdentifierDefinitionList),
    moduleClasses,
    records,
    enums,
  };
}

async function mergeFileContents(absoluteFilePaths: string[]): Promise<string> {
  const filesContents = await taskAll(absoluteFilePaths, (filePath) =>
    fs.promises.readFile(filePath, 'utf-8')
  );
  return filesContents.join('');
}

async function withTempFile<T>(content: string, fn: (filePath: string) => Promise<T>): Promise<T> {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'type-gen-'));
  const filePath = path.join(tempDir, 'TypeInformationTemporaryFile.swift');

  try {
    await fs.promises.writeFile(filePath, content, 'utf8');
    return await fn(filePath);
  } finally {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
}

export async function withPreparedSingleFile<T>(
  { input, typeInference, mapUnicodeCharacters, runOnQueue }: GetFileTypeInformationOptions,
  fn: (filePath: string) => Promise<T>
): Promise<T> {
  const shouldPreprocessFile =
    typeInference === TypeInferenceOption.PREPROCESS_AND_INFERENCE ||
    mapUnicodeCharacters ||
    runOnQueue;
  if (!shouldPreprocessFile && input.type === 'file' && input.inputFileAbsolutePaths.length === 0) {
    return fn(input.inputFileAbsolutePaths[0] as string);
  }

  const fileContent =
    input.type === 'file'
      ? await mergeFileContents(input.inputFileAbsolutePaths)
      : input.fileContent;

  const preprocessFileOptions = {
    preprocessReturns: shouldPreprocessFile,
    mapUnicodeCharacters,
    runOnQueue,
  };
  if (shouldPreprocessFile) {
    return withTempFile(preprocessSwiftFile(fileContent, preprocessFileOptions), fn);
  }
  return withTempFile(fileContent, fn);
}

/**
 * Reads and extracts `FileTypeInformation` from either a provided file path or a raw string of source code.
 * If a raw string is provided, or if the `PREPROCESS_AND_INFERENCE` inference option is selected,
 * the function will create a temporary file with the (optionally preprocessed) content to facilitate parsing.
 * @param options - Configuration object containing the input source (file or string) and the desired level of type inference.
 * @returns A promise that resolves to a `FileTypeInformation` object if the input was parsed successfully. Otherwise, it resolves to `null`.
 * @header TypeInformationAbstraction
 */
export async function getFileTypeInformation({
  input,
  typeInference,
  mapUnicodeCharacters,
  runOnQueue,
}: GetFileTypeInformationOptions): Promise<FileTypeInformation | null> {
  const shouldPreprocessFile =
    typeInference === TypeInferenceOption.PREPROCESS_AND_INFERENCE ||
    runOnQueue ||
    mapUnicodeCharacters;
  const typeInferenceOn = typeInference !== TypeInferenceOption.NO_INFERENCE;
  if (!shouldPreprocessFile && input.type === 'file' && input.inputFileAbsolutePaths.length === 0) {
    return getSwiftFileTypeInformation(input.inputFileAbsolutePaths[0] as string, {
      typeInference: typeInferenceOn,
    });
  }

  return withPreparedSingleFile(
    { input, typeInference, mapUnicodeCharacters, runOnQueue },
    async (tempFilePath) => {
      return getSwiftFileTypeInformation(tempFilePath, { typeInference: typeInferenceOn });
    }
  );
}
