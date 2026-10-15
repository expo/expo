import { usePageMetadata } from '~/providers/page-metadata';
import { Terminal, type PackageManagerCommandSet } from '~/ui/components/Snippet';
import { A, P, CODE } from '~/ui/components/Text';

type AgentSkillSectionProps = {
  packageName?: string;
};

// Pin `@latest` because npm, pnpm, and bun can reuse a cached older version of the CLI.
const getInstallCmd = (packageName: string): PackageManagerCommandSet => ({
  npm: [`$ npx --yes @expo/agent-cli@latest install ${packageName}`],
  yarn: [`$ yarn dlx @expo/agent-cli@latest install ${packageName}`],
  pnpm: [`$ pnpm dlx @expo/agent-cli@latest install ${packageName}`],
  bun: [`$ bunx @expo/agent-cli@latest install ${packageName}`],
});

export function AgentSkillSection(props: AgentSkillSectionProps) {
  const { packageName: metadataPackageName } = usePageMetadata();
  const packageName = props.packageName ?? metadataPackageName ?? '';

  return (
    <>
      <P className="mb-4">
        <CODE>{packageName}</CODE> includes an agent skill that helps AI coding agents use this
        library. Install the library and its skill in your project. You can also run this command
        when the library is already installed:
      </P>
      <Terminal cmd={getInstallCmd(packageName)} />
      <P>
        For skills that cover Expo and EAS in general, see <A href="/skills/">Expo Skills</A>.
      </P>
    </>
  );
}
