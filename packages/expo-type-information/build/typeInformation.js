"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeInferenceOption = exports.BasicType = exports.TypeKind = exports.IdentifierKind = void 0;
exports.serializeTypeInformation = serializeTypeInformation;
exports.deserializeTypeInformation = deserializeTypeInformation;
exports.getFileTypeInformation = getFileTypeInformation;
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const sourcekittenTypeInformation_1 = require("./swift/sourcekittenTypeInformation");
const utils_1 = require("./utils");
var IdentifierKind;
(function (IdentifierKind) {
    IdentifierKind[IdentifierKind["BASIC"] = 0] = "BASIC";
    IdentifierKind[IdentifierKind["ENUM"] = 1] = "ENUM";
    IdentifierKind[IdentifierKind["RECORD"] = 2] = "RECORD";
    IdentifierKind[IdentifierKind["CLASS"] = 3] = "CLASS";
})(IdentifierKind || (exports.IdentifierKind = IdentifierKind = {}));
var TypeKind;
(function (TypeKind) {
    TypeKind[TypeKind["BASIC"] = 0] = "BASIC";
    TypeKind[TypeKind["IDENTIFIER"] = 1] = "IDENTIFIER";
    TypeKind[TypeKind["SUM"] = 2] = "SUM";
    TypeKind[TypeKind["PARAMETRIZED"] = 3] = "PARAMETRIZED";
    TypeKind[TypeKind["OPTIONAL"] = 4] = "OPTIONAL";
    TypeKind[TypeKind["ARRAY"] = 5] = "ARRAY";
    TypeKind[TypeKind["DICTIONARY"] = 6] = "DICTIONARY";
})(TypeKind || (exports.TypeKind = TypeKind = {}));
var BasicType;
(function (BasicType) {
    BasicType[BasicType["ANY"] = 0] = "ANY";
    BasicType[BasicType["STRING"] = 1] = "STRING";
    BasicType[BasicType["NUMBER"] = 2] = "NUMBER";
    BasicType[BasicType["BOOLEAN"] = 3] = "BOOLEAN";
    BasicType[BasicType["VOID"] = 4] = "VOID";
    BasicType[BasicType["UNDEFINED"] = 5] = "UNDEFINED";
    BasicType[BasicType["UNRESOLVED"] = 6] = "UNRESOLVED";
})(BasicType || (exports.BasicType = BasicType = {}));
/**
 * Used for testing purposes, maps Sets and Maps to Arrays and returns FileTypeInformationSerialized object which can be written to a JSON.
 * @param param0 FileTypeInformation object to serialize.
 * @returns FileTypeInformationSerialized object.
 */
function serializeTypeInformation({ usedTypeIdentifiers, declaredTypeIdentifiers, inferredTypeParametersCount, typeIdentifierDefinitionMap, moduleClasses, records, enums, }) {
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
 * Used for testing purposes, maps Arrays to Sets and Maps depending on the field and returns FileTypeInformation object.
 * @param param0 FileTypeInformationSerialized object to deserialize.
 * @returns FileTypeInformation object.
 */
function deserializeTypeInformation({ usedTypeIdentifiersList, declaredTypeIdentifiersList, inferredTypeParametersCountList, typeIdentifierDefinitionList, moduleClasses, records, enums, }) {
    return {
        usedTypeIdentifiers: new Set(usedTypeIdentifiersList),
        declaredTypeIdentifiers: new Set(declaredTypeIdentifiersList),
        inferredTypeParametersCount: new Map(inferredTypeParametersCountList),
        typeIdentifierDefinitionMap: new Map(typeIdentifierDefinitionList),
        moduleClasses,
        records,
        enums,
    };
}
/**
 * Defines the level of type inference to apply when extracting type information.
 * Note: In case where type inference is on, it may take more then twice the time to compute the type information.
 */
var TypeInferenceOption;
(function (TypeInferenceOption) {
    /** No type inference will be performed. */
    TypeInferenceOption[TypeInferenceOption["NO_INFERENCE"] = 0] = "NO_INFERENCE";
    /** Basic type inference will be applied. */
    TypeInferenceOption[TypeInferenceOption["SIMPLE_INFERENCE"] = 1] = "SIMPLE_INFERENCE";
    /** Preprocesses the file by injecting returns to extract more type info from sourcekitten. */
    TypeInferenceOption[TypeInferenceOption["PREPROCESS_AND_INFERENCE"] = 2] = "PREPROCESS_AND_INFERENCE";
})(TypeInferenceOption || (exports.TypeInferenceOption = TypeInferenceOption = {}));
async function mergeFileContents(absoluteFilePaths) {
    const filesContents = await (0, utils_1.taskAll)(absoluteFilePaths, (filePath) => fs.promises.readFile(filePath, 'utf-8'));
    return filesContents.join('');
}
async function withTempFile(content, fn) {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'type-gen-'));
    const filePath = path.join(tempDir, 'TypeInformationTemporaryFile.swift');
    try {
        await fs.promises.writeFile(filePath, content, 'utf8');
        return await fn(filePath);
    }
    finally {
        await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
}
/**
 * Reads and extracts `FileTypeInformation` from either a provided file path or a raw string of source code.
 * If a raw string is provided, or if the `PREPROCESS_AND_INFERENCE` inference option is selected,
 * the function will create a temporary file with the (optionally preprocessed) content to facilitate parsing.
 * @param options - Configuration object containing the input source (file or string) and the desired level of type inference.
 * @returns A promise that resolves to a `FileTypeInformation` object if the input was parsed successfully. Otherwise, it returns `null`.
 */
async function getFileTypeInformation({ input, typeInference, }) {
    const shouldPreprocessFile = typeInference === TypeInferenceOption.PREPROCESS_AND_INFERENCE;
    const typeInferenceOn = typeInference !== TypeInferenceOption.NO_INFERENCE;
    if (!shouldPreprocessFile && input.type === 'file' && input.inputFileAbsolutePaths.length === 0) {
        return (0, sourcekittenTypeInformation_1.getSwiftFileTypeInformation)(input.inputFileAbsolutePaths[0], {
            typeInference: typeInferenceOn,
        });
    }
    const fileContent = input.type === 'file'
        ? await mergeFileContents(input.inputFileAbsolutePaths)
        : input.fileContent;
    const preprocessedContent = shouldPreprocessFile ? (0, sourcekittenTypeInformation_1.preprocessSwiftFile)(fileContent) : fileContent;
    return withTempFile(preprocessedContent, async (tempFilePath) => {
        return (0, sourcekittenTypeInformation_1.getSwiftFileTypeInformation)(tempFilePath, {
            typeInference: typeInferenceOn,
        });
    });
}
//# sourceMappingURL=typeInformation.js.map