import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';
import { learnMore } from '../utils/TerminalLink';
import { getDeepDependenciesWarningAsync } from '../utils/explainDependencies';

export class VectorIconsCheck implements DoctorCheck {
  description =
    'Check that @expo/vector-icons package is not installed together with other potentially conflicting icon packages.';

  sdkVersionRange = '>=53.0.0';

  async runAsync({ projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    // Check what icon packages are installed
    const [reactNativeVectorIconsCommon, expoVectorIcons, reactNativeVectorIcons] =
      await Promise.all([
        getDeepDependenciesWarningAsync({ name: '@react-native-vector-icons/common' }, projectRoot),
        getDeepDependenciesWarningAsync({ name: '@expo/vector-icons' }, projectRoot),
        getDeepDependenciesWarningAsync({ name: 'react-native-vector-icons' }, projectRoot),
      ]);

    const issues: string[] = [];
    if (reactNativeVectorIconsCommon && (expoVectorIcons || reactNativeVectorIcons)) {
      issues.push(
        'This project or its dependencies uses both the [scoped icon packages](https://www.npmjs.com/org/react-native-vector-icons) and [`@expo/vector-icons`](https://www.npmjs.com/package/@expo/vector-icons) or deprecated [`react-native-vector-icons`](https://www.npmjs.com/package/react-native-vector-icons) packages. This can lead to icon rendering issues due to conflicts between the packages.'
      );
    }

    return {
      isSuccessful: !issues.length,
      issues,
      advice: issues.length
        ? [
            'If you wish to use the scoped icon packages, migrate your project by running the codemod: `npx @react-native-vector-icons/codemod`',
          ]
        : [],
    };
  }
}
