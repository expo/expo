"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCodeSigningAsync = generateCodeSigningAsync;
const code_signing_certificates_1 = require("@expo/code-signing-certificates");
const assert_1 = __importDefault(require("assert"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const dir_1 = require("./utils/dir");
const log_1 = require("./utils/log");
async function generateCodeSigningAsync(projectRoot, { certificateValidityDurationYears, keyOutput, certificateOutput, certificateCommonName }) {
    const validityDurationYears = Math.floor(certificateValidityDurationYears);
    const certificateOutputDir = path_1.default.resolve(projectRoot, certificateOutput);
    const keyOutputDir = path_1.default.resolve(projectRoot, keyOutput);
    await Promise.all([(0, dir_1.ensureDirAsync)(certificateOutputDir), (0, dir_1.ensureDirAsync)(keyOutputDir)]);
    const [certificateOutputDirContents, keyOutputDirContents] = await Promise.all([
        fs_1.promises.readdir(certificateOutputDir),
        fs_1.promises.readdir(keyOutputDir),
    ]);
    (0, assert_1.default)(certificateOutputDirContents.length === 0, 'Certificate output directory must be empty');
    (0, assert_1.default)(keyOutputDirContents.length === 0, 'Key output directory must be empty');
    const keyPair = (0, code_signing_certificates_1.generateKeyPair)();
    const validityNotBefore = new Date();
    const validityNotAfter = new Date();
    validityNotAfter.setFullYear(validityNotAfter.getFullYear() + validityDurationYears);
    const certificate = (0, code_signing_certificates_1.generateSelfSignedCodeSigningCertificate)({
        keyPair,
        validityNotBefore,
        validityNotAfter,
        commonName: certificateCommonName,
    });
    const keyPairPEM = (0, code_signing_certificates_1.convertKeyPairToPEM)(keyPair);
    const certificatePEM = (0, code_signing_certificates_1.convertCertificateToCertificatePEM)(certificate);
    await Promise.all([
        fs_1.promises.writeFile(path_1.default.join(keyOutputDir, 'public-key.pem'), keyPairPEM.publicKeyPEM),
        fs_1.promises.writeFile(path_1.default.join(keyOutputDir, 'private-key.pem'), keyPairPEM.privateKeyPEM),
        fs_1.promises.writeFile(path_1.default.join(certificateOutputDir, 'certificate.pem'), certificatePEM),
    ]);
    (0, log_1.log)(`Generated public and private keys output in ${keyOutputDir}. Remember to add them to .gitignore or to encrypt them. (e.g. with git-crypt)`);
    (0, log_1.log)(`Generated code signing certificate output in ${certificateOutputDir}.`);
    (0, log_1.log)(`To automatically configure this project for code signing, run \`yarn expo-updates codesigning:configure --certificate-input-directory=${certificateOutput} --key-input-directory=${keyOutput}\`.`);
}
