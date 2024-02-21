const { AndroidConfig, withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs/promises');
const path = require('path');

const withAndroidNetworkSecurityConfig = (config) => {
  config = withAndroidNetworkSecurityConfigManifest(config);
  config = withAndroidNetworkSecurityConfigXml(config);
  return config;
};

const withAndroidNetworkSecurityConfigManifest = (config) => {
  return withAndroidManifest(config, (config) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    mainApplication.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    return config;
  });
};

const withAndroidNetworkSecurityConfigXml = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectPath = await AndroidConfig.Paths.getProjectPathOrThrowAsync(
        config.modRequest.projectRoot
      );

      await fs.mkdir(path.join(projectPath, 'app/src/main/res/xml'), { recursive: true });
      await fs.writeFile(
        path.join(projectPath, 'app/src/main/res/xml/network_security_config.xml'),
        `\
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <domain-config cleartextTrafficPermitted="true">
    <!-- for e2e testing on release build, we need cleartext traffic from local server -->
    <domain includeSubdomains="true">10.0.2.2</domain>
    <domain includeSubdomains="true">localhost</domain>
  </domain-config>
</network-security-config>
`
      );

      await fs.mkdir(path.join(projectPath, 'app/src/debug/res/xml'), { recursive: true });
      await fs.writeFile(
        path.join(projectPath, 'app/src/debug/res/xml/network_security_config.xml'),
        `\
<?xml version="1.0" encoding="utf-8"?>
<network-security-config xmlns:tools="http://schemas.android.com/tools">
  <base-config
    cleartextTrafficPermitted="true"
    tools:ignore="InsecureBaseConfiguration" />
</network-security-config>
`
      );
      return config;
    },
  ]);
};

module.exports = withAndroidNetworkSecurityConfig;
