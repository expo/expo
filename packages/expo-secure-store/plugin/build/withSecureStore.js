"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('expo-secure-store/package.json');
const BACKUP_RULES_PATH = '@xml/secure_store_backup_rules';
const EXTRACTION_RULES_PATH = '@xml/secure_store_data_extraction_rules';
const FACEID_USAGE = 'Allow $(PRODUCT_NAME) to access your Face ID biometric data.';
const withSecureStore = (config, { faceIDPermission, configureAndroidBackup = true } = {}) => {
    config_plugins_1.IOSConfig.Permissions.createPermissionsPlugin({
        NSFaceIDUsageDescription: FACEID_USAGE,
    })(config, {
        NSFaceIDUsageDescription: faceIDPermission,
    });
    (0, config_plugins_1.withAndroidManifest)(config, (config) => {
        const mainApplication = config_plugins_1.AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
        const backupConfig = mainApplication.$['android:fullBackupContent']; // SDK <= 30
        const dataExtractionRules = mainApplication.$['android:dataExtractionRules']; // SDK >= 31
        if (!configureAndroidBackup) {
            backupConfig === BACKUP_RULES_PATH && delete mainApplication.$['android:fullBackupContent'];
            dataExtractionRules === EXTRACTION_RULES_PATH &&
                delete mainApplication.$['android:dataExtractionRules'];
            return config;
        }
        const canApplyBackupConfig = !backupConfig || backupConfig === BACKUP_RULES_PATH;
        const canApplyDataExtractionRules = !dataExtractionRules || dataExtractionRules === EXTRACTION_RULES_PATH;
        if (canApplyBackupConfig && canApplyDataExtractionRules) {
            mainApplication.$['android:fullBackupContent'] = BACKUP_RULES_PATH;
            mainApplication.$['android:dataExtractionRules'] = EXTRACTION_RULES_PATH;
            return config;
        }
        console.warn('Expo-secure-store tried to apply Android Auto Backup rules, but other backup rules are already present. ' +
            'Refer to the expo-secure-store docs (https://docs.expo.dev/versions/latest/sdk/securestore/) to configure your backup rules.');
        return config;
    });
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withSecureStore, pkg.name, pkg.version);
