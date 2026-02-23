import { ConfigPlugin, WarningAggregator, withInfoPlist } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';

type WithIosWarningProps = { property: string; warning: string };

// Hack to display the warning only once
const withIosWarning: ConfigPlugin<WithIosWarningProps> = (
  config: ExpoConfig,
  { property, warning }: WithIosWarningProps
) =>
  withInfoPlist(config, (config) => {
    WarningAggregator.addWarningIOS(property, warning);
    return config;
  });

export default withIosWarning;
