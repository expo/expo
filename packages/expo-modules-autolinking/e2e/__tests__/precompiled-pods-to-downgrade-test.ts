import { execFileSync } from 'child_process';
import { join } from 'path';

const precompiledModulesPath = join(__dirname, '../../scripts/ios/precompiled_modules.rb');

// Loads precompiled_modules.rb with just enough of the CocoaPods surface stubbed out.
const rubyPrelude = `
require 'json'

$messages = []

module Pod
  module UI
    def self.puts(message); $messages << message; end
    def self.info(*args); end
    def self.warn(*args); end
  end
end

class String
  %w[blue yellow green red cyan magenta].each do |color|
    define_method(color) { self } unless method_defined?(color)
  end
end

require ARGV.fetch(0)
input = JSON.parse(STDIN.read)
`;

const fakePodTargetsScript = `${rubyPrelude}
Dependency = Struct.new(:name)
RootSpec = Struct.new(:dependencies, :attributes_hash)
FakePodTarget = Struct.new(:name, :pod_name, :root_spec, :built, :linkage, :recursive_dependent_targets) do
  def should_build?; built; end
  def build_as_dynamic?; linkage == 'dynamic'; end
  def build_as_static?; linkage == 'static'; end

  # Private, as in Pod::Target.
  private def build_type
    :"#{linkage}_framework"
  end
end

targets = {}
input['targets'].each do |t|
  root_spec = RootSpec.new(t.fetch('dependencies', []).map { |name| Dependency.new(name) }, t.fetch('attributes', {}))
  targets[t['name']] = FakePodTarget.new(t['name'], t.fetch('podName', t['name']), root_spec, t.fetch('built', true), t.fetch('linkage', 'dynamic'), [])
end
input['targets'].each do |t|
  targets[t['name']].recursive_dependent_targets = t.fetch('recursiveDependencies', []).map { |name| targets.fetch(name) }
end
`;

const podsToDowngradeScript = `${fakePodTargetsScript}
result = Expo::PrecompiledModules.pods_to_downgrade(
  targets.values,
  linkage: input['linkage'].to_sym,
  framework_modules_to_patch: input['frameworkModulesToPatch'],
  spm_dependency_pods: input['spmDependencyPods']
)
puts JSON.generate('pods' => result.to_a.sort, 'messages' => $messages)
`;

type FakePodTarget = {
  name: string;
  podName?: string;
  dependencies?: string[];
  recursiveDependencies?: string[];
  attributes?: Record<string, unknown>;
  built?: boolean;
  linkage?: 'dynamic' | 'static';
};

// A frameworks app on the prebuilt React.xcframework. stripe-react-native, Foo
// and ExpoSPMPod may resolve Swift packages through `spm_dependency`;
// react-native-screens never does. ExpoModulesCore is forced to link statically.
const appPodTargets: FakePodTarget[] = [
  { name: 'React-Core', built: false },
  {
    name: 'React-Core-prebuilt',
    built: false,
    attributes: { vendored_frameworks: 'React.xcframework' },
  },
  {
    name: 'ReactCodegen',
    dependencies: ['React-Core'],
    recursiveDependencies: ['React-Core', 'React-Core-prebuilt'],
  },
  {
    name: 'stripe-react-native',
    dependencies: ['React-Core', 'ReactCodegen'],
    recursiveDependencies: ['React-Core', 'React-Core-prebuilt', 'ReactCodegen'],
  },
  {
    name: 'Foo-iOS',
    podName: 'Foo',
    dependencies: ['React-Core'],
    recursiveDependencies: ['React-Core'],
  },
  {
    name: 'RNScreens',
    dependencies: ['React-Core'],
    recursiveDependencies: ['React-Core', 'React-Core-prebuilt'],
  },
  { name: 'RNScreensConsumer', recursiveDependencies: ['RNScreens'] },
  {
    name: 'ExpoModulesCore',
    dependencies: ['React-Core'],
    recursiveDependencies: ['React-Core'],
  },
  { name: 'ExpoSPMPod', recursiveDependencies: ['ExpoModulesCore', 'React-Core'] },
  { name: 'ForcedStatic' },
  { name: 'SDWebImage' },
];

const podsDowngradedToday = [
  'ExpoModulesCore',
  'ExpoSPMPod',
  'Foo-iOS',
  'ForcedStatic',
  'RNScreens',
  'RNScreensConsumer',
  'React-Core-prebuilt',
  'ReactCodegen',
  'stripe-react-native',
];

const stripeGraph = ['stripe-react-native', 'ReactCodegen', 'React-Core-prebuilt'];

function without(pods: string[], removed: string[]): string[] {
  return pods.filter((pod) => !removed.includes(pod));
}

function runRuby<T>(script: string, input: unknown): T {
  try {
    const stdout = execFileSync('ruby', ['-e', script, precompiledModulesPath], {
      input: JSON.stringify(input),
      stdio: 'pipe',
    });
    return JSON.parse(stdout.toString()) as T;
  } catch (error: unknown) {
    if (error instanceof Error) {
      const { stderr } = error as Error & { stderr?: Buffer };
      error.message = `${error.message}\n${stderr?.toString() ?? ''}`;
    }
    throw error;
  }
}

function podsToDowngrade(
  spmDependencyPods: string[],
  linkage: 'dynamic' | 'static' = 'dynamic'
): { pods: string[]; messages: string[] } {
  return runRuby(podsToDowngradeScript, {
    targets: appPodTargets,
    linkage,
    frameworkModulesToPatch: ['ForcedStatic', 'ExpoModulesCore'],
    spmDependencyPods,
  });
}

function rubyAvailable(): boolean {
  try {
    execFileSync('ruby', ['--version'], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

(rubyAvailable() ? describe : describe.skip)('precompiled modules pods to downgrade', () => {
  it('keeps a pod that uses spm_dependency and all of its dependencies dynamic', () => {
    const { pods, messages } = podsToDowngrade(['stripe-react-native']);
    for (const pod of stripeGraph) {
      expect(pods).not.toContain(pod);
    }
    expect(messages).toEqual([expect.stringContaining('(stripe-react-native)')]);
  });

  it('still downgrades pods outside the spm_dependency pod graph', () => {
    expect(podsToDowngrade(['stripe-react-native']).pods).toEqual(
      without(podsDowngradedToday, stripeGraph)
    );
  });

  it('downgrades the same pods as before when no pod uses spm_dependency', () => {
    expect(podsToDowngrade([])).toEqual({ pods: podsDowngradedToday, messages: [] });
  });

  it('downgrades the same pods as before with static frameworks', () => {
    expect(podsToDowngrade(['stripe-react-native', 'Foo'], 'static')).toEqual({
      pods: podsDowngradedToday,
      messages: [],
    });
  });

  it('matches spm_dependency pods by root spec name', () => {
    expect(podsToDowngrade(['Foo']).pods).toEqual(without(podsDowngradedToday, ['Foo-iOS']));
  });

  it('downgrades an spm_dependency pod that depends on a pod forced to link statically', () => {
    const { pods, messages } = podsToDowngrade(['ExpoSPMPod', 'stripe-react-native']);
    expect(pods).toEqual(without(podsDowngradedToday, stripeGraph));
    expect(messages).toEqual([
      expect.stringMatching(/ExpoSPMPod.*ExpoModulesCore/),
      expect.stringContaining('(stripe-react-native)'),
    ]);
  });

  it('downgrades an spm_dependency pod that is itself forced to link statically', () => {
    const { pods, messages } = podsToDowngrade(['ForcedStatic']);
    expect(pods).toEqual(podsDowngradedToday);
    expect(messages).toEqual([expect.stringContaining('ForcedStatic')]);
  });
});

(rubyAvailable() ? describe : describe.skip)('precompiled modules pre-install build types', () => {
  const preInstallScript = `${fakePodTargetsScript}
module Pod
  class BuildType
    def self.static_library; :static_library; end
  end
end

ENV['EXPO_USE_PRECOMPILED_MODULES'] = '1'
ENV['USE_FRAMEWORKS'] = 'dynamic'
ENV.delete('RCT_USE_PREBUILT_RNCORE')
# Stages xcframeworks on disk; not part of the linkage decision.
Expo::PrecompiledModules.define_singleton_method(:ensure_shared_spm_deps) { |_installer| }
Expo::PrecompiledModules.spm_dependency_pods.merge(input['spmDependencyPods'])

Podfile = Struct.new(:framework_modules_to_patch)
Installer = Struct.new(:pod_targets, :podfile)
Expo::PrecompiledModules.perform_pre_install(Installer.new(targets.values, Podfile.new(input['frameworkModulesToPatch'])))

build_types = targets.values.map do |t|
  begin
    [t.name, t.public_send(:build_type).to_s]
  rescue NoMethodError => e
    [t.name, e.message]
  end
end
puts JSON.generate(build_types.to_h)
`;

  // @react-native-firebase's post_install reads `build_type` on every pod whose name starts with RNFB.
  it('makes build_type public on pods kept as frameworks, with their original value', () => {
    const buildTypes = runRuby<Record<string, string>>(preInstallScript, {
      targets: appPodTargets,
      frameworkModulesToPatch: ['ForcedStatic', 'ExpoModulesCore'],
      spmDependencyPods: ['stripe-react-native'],
    });
    expect(buildTypes).toMatchObject({
      'stripe-react-native': 'dynamic_framework',
      ReactCodegen: 'dynamic_framework',
      'React-Core-prebuilt': 'dynamic_framework',
      RNScreens: 'static_library',
      ExpoModulesCore: 'static_library',
      SDWebImage: 'dynamic_framework',
    });
  });
});

(rubyAvailable() ? describe : describe.skip)('precompiled modules spm_dependency recording', () => {
  const recordingScript = `
class SPMManager
  attr_reader :calls

  def dependency(pod_spec, url:, requirement:, products:)
    (@calls ||= []) << { 'pod' => pod_spec.name, 'url' => url, 'requirement' => requirement, 'products' => products }
  end
end
${rubyPrelude}
Expo::PrecompiledModules.record_spm_dependency_pods
Expo::PrecompiledModules.record_spm_dependency_pods

spm = SPMManager.new
input['pods'].each do |pod|
  spm.dependency(Struct.new(:name).new(pod), url: 'https://example.com/sdk', requirement: { 'kind' => 'exactVersion', 'version' => '1.0.0' }, products: ['SDK'])
end
puts JSON.generate('recorded' => Expo::PrecompiledModules.spm_dependency_pods.to_a, 'calls' => spm.calls)
`;

  it('records the root names of pods that call spm_dependency and forwards each call once', () => {
    const pods = ['stripe-react-native', 'Foo/Bar', 'Foo/Baz'];
    const { recorded, calls } = runRuby<{ recorded: string[]; calls: unknown[] }>(recordingScript, {
      pods,
    });
    expect(recorded).toEqual(['stripe-react-native', 'Foo']);
    expect(calls).toEqual(
      pods.map((pod) => ({
        pod,
        url: 'https://example.com/sdk',
        requirement: { kind: 'exactVersion', version: '1.0.0' },
        products: ['SDK'],
      }))
    );
  });

  it('does nothing when React Native has not loaded SPMManager', () => {
    const script = `${rubyPrelude}
Expo::PrecompiledModules.record_spm_dependency_pods
puts JSON.generate(Expo::PrecompiledModules.spm_dependency_pods.to_a)
`;
    expect(runRuby(script, {})).toEqual([]);
  });
});
