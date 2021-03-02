import { getIosProjectsReports } from './isoProjectReports';

export interface Options {
  clearCache: boolean;
}

export default async function iosUpdateNativeDependencies(options: Options) {
  const reports = await getIosProjectsReports(options);
}
