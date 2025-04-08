"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureCodeSigningAsync = configureCodeSigningAsync;
const code_signing_certificates_1 = require("@expo/code-signing-certificates");
const config_1 = require("@expo/config");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const log_1 = require("./utils/log");
const modifyConfigAsync_1 = require("./utils/modifyConfigAsync");
async function configureCodeSigningAsync(projectRoot, { certificateInput, keyInput, keyid }) {
    const certificateInputDir = path_1.default.resolve(projectRoot, certificateInput);
    const keyInputDir = path_1.default.resolve(projectRoot, keyInput);
    const [certificatePEM, privateKeyPEM, publicKeyPEM] = await Promise.all([
        fs_1.promises.readFile(path_1.default.join(certificateInputDir, 'certificate.pem'), 'utf8'),
        fs_1.promises.readFile(path_1.default.join(keyInputDir, 'private-key.pem'), 'utf8'),
        fs_1.promises.readFile(path_1.default.join(keyInputDir, 'public-key.pem'), 'utf8'),
    ]);
    const certificate = (0, code_signing_certificates_1.convertCertificatePEMToCertificate)(certificatePEM);
    const keyPair = (0, code_signing_certificates_1.convertKeyPairPEMToKeyPair)({ privateKeyPEM, publicKeyPEM });
    (0, code_signing_certificates_1.validateSelfSignedCertificate)(certificate, keyPair);
    const { exp } = (0, config_1.getConfig)(projectRoot, { skipSDKVersionRequirement: true });
    const fields = {
        codeSigningCertificate: `./${path_1.default.relative(projectRoot, certificateInputDir)}/certificate.pem`,
        codeSigningMetadata: {
            keyid: keyid ?? 'main',
            alg: 'rsa-v1_5-sha256',
        },
    };
    await (0, modifyConfigAsync_1.attemptModification)(projectRoot, {
        updates: {
            ...exp.updates,
            ...fields,
        },
    }, {
        updates: {
            ...fields,
        },
    });
    (0, log_1.log)(`Code signing configuration written to app configuration.`);
}
