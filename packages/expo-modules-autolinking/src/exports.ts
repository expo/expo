export * from './autolinking';

export {
  ResolutionResult,
  BaseDependencyResolution,
  DependencyResolution,
  DependencyResolutionSource,
  CachedDependenciesLinker,
  CachedDependenciesSearchOptions,
  makeCachedDependenciesLinker,
  scanDependencyResolutionsForPlatform,
} from './dependencies';
