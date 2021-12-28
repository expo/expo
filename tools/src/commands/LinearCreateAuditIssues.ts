import linearCreateAuditIssues from '../linear-create-audit-issues';

export default (program: any) => {
  program
    .command('linear-create-audit-issues [packageNames...]')
    .alias('lcai')
    .description(
      `Creates or updates per-Expo Module audit issues in Linear.app. Moreover gathers all these issues in one umbrella issue.
If you do not provide any package name, it will create issues for all Expo modules.`
    )
    .action(async (packageNames: string[]) => {
      if (!process.env.LINEAR_API_KEY) {
        throw new Error(
          'LINEAR_API_KEY environmental variable is not set. First set it and then launch this script again.'
        );
      }
      await linearCreateAuditIssues({ packageNames });
    });
};
