import type { BuildProps } from './resolveOptions';

export function getXcodeBuildArgs(
  props: Pick<BuildProps, 'xcodeProject' | 'configuration' | 'scheme'>
): string[] {
  return [
    props.xcodeProject.isWorkspace ? '-workspace' : '-project',
    props.xcodeProject.name,
    '-configuration',
    props.configuration,
    '-scheme',
    props.scheme,
    '-destination',
    'generic/platform=iOS Simulator',
    'COCOAPODS_PARALLEL_CODE_SIGN=true',
    'COMPILER_INDEX_STORE_ENABLE=NO',
  ];
}
