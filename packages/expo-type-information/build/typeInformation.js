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
exports.BasicType = exports.TypeKind = exports.IdentifierKind = void 0;
exports.serializeTypeInformation = serializeTypeInformation;
exports.deserializeTypeInformation = deserializeTypeInformation;
exports.getFileTypeInformation = getFileTypeInformation;
exports.getFileTypeInformationForString = getFileTypeInformationForString;
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const sourcekittenTypeInformation_1 = require("./swift/sourcekittenTypeInformation");
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
function serializeTypeInformation({ usedTypeIdentifiers, declaredTypeIdentifiers, typeParametersCount, typeIdentifierDefinitionMap, moduleClasses, records, enums, }) {
    return {
        usedTypeIdentifiersList: [...usedTypeIdentifiers.keys()].sort(),
        declaredTypeIdentifiersList: [...declaredTypeIdentifiers.keys()].sort(),
        typeParametersCountList: [...typeParametersCount.entries()].sort(),
        typeIdentifierDefinitionList: [...typeIdentifierDefinitionMap.entries()].sort(),
        moduleClasses,
        records,
        enums,
    };
}
function deserializeTypeInformation({ usedTypeIdentifiersList, declaredTypeIdentifiersList, typeParametersCountList, typeIdentifierDefinitionList, moduleClasses, records, enums, }) {
    return {
        usedTypeIdentifiers: new Set(usedTypeIdentifiersList),
        declaredTypeIdentifiers: new Set(declaredTypeIdentifiersList),
        typeParametersCount: new Map(typeParametersCountList),
        typeIdentifierDefinitionMap: new Map(typeIdentifierDefinitionList),
        moduleClasses,
        records,
        enums,
    };
}
function getFileTypeInformation(absoluteFilePath, preprocessFile = false) {
    if (absoluteFilePath.endsWith('.swift')) {
        if (preprocessFile) {
            return getFileTypeInformationForString(fs.readFileSync(absoluteFilePath, 'utf-8'), 'swift');
        }
        return (0, sourcekittenTypeInformation_1.getSwiftFileTypeInformation)(absoluteFilePath);
    }
    return null;
}
function getFileTypeInformationForString(content, language) {
    if (language === 'swift') {
        const tmp = os.tmpdir();
        const filePath = path.resolve(tmp, 'TypeInformationTemporaryFile.swift');
        const preprocessedContent = (0, sourcekittenTypeInformation_1.preprocessSwiftFile)(content);
        fs.writeFileSync(filePath, preprocessedContent, 'utf8');
        const fileTypeInfo = getFileTypeInformation(filePath);
        fs.rmSync(filePath);
        return fileTypeInfo;
    }
    return null;
}
//# sourceMappingURL=typeInformation.js.map