import { useRouter } from 'next/router';
import React from 'react';

import AndroidPhysicalDevelopmentBuild from './instructions/androidPhysicalDevelopmentBuild.mdx';
import AndroidPhysicalDevelopmentBuildLocal from './instructions/androidPhysicalDevelopmentBuildLocal.mdx';
import AndroidPhysicalExpoGo from './instructions/androidPhysicalExpoGo.mdx';
import AndroidSimulatedDevelopmentBuild from './instructions/androidSimulatedDevelopmentBuild.mdx';
import AndroidSimulatedDevelopmentBuildLocal from './instructions/androidSimulatedDevelopmentBuildLocal.mdx';
import AndroidSimulatedExpoGo from './instructions/androidSimulatedExpoGo.mdx';
import IosPhysicalDevelopmentBuild from './instructions/iosPhysicalDevelopmentBuild.mdx';
import IosPhysicalDevelopmentBuildLocal from './instructions/iosPhysicalDevelopmentBuildLocal.mdx';
import IosPhysicalExpoGo from './instructions/iosPhysicalExpoGo.mdx';
import IosSimulatedDevelopmentBuild from './instructions/iosSimulatedDevelopmentBuild.mdx';
import IosSimulatedDevelopmentBuildLocal from './instructions/iosSimulatedDevelopmentBuildLocal.mdx';
import IosSimulatedExpoGo from './instructions/iosSimulatedExpoGo.mdx';

export function DevelopmentEnvironmentInstructions() {
  const router = useRouter();
  const { query: _query } = router;

  const query = {
    platform: 'android',
    device: 'physical',
    mode: 'expo-go',
    buildEnv: null,
    ..._query,
  };

  if (
    query.platform === 'android' &&
    query.device === 'physical' &&
    query.mode === 'development-build'
  ) {
    if (query.buildEnv === 'local') {
      return <AndroidPhysicalDevelopmentBuildLocal />;
    }

    return <AndroidPhysicalDevelopmentBuild />;
  }

  if (query.platform === 'android' && query.device === 'physical' && query.mode === 'expo-go') {
    return <AndroidPhysicalExpoGo />;
  }

  if (
    query.platform === 'android' &&
    query.device === 'simulated' &&
    query.mode === 'development-build'
  ) {
    if (query.buildEnv === 'local') {
      return <AndroidSimulatedDevelopmentBuildLocal />;
    }

    return <AndroidSimulatedDevelopmentBuild />;
  }

  if (query.platform === 'android' && query.device === 'simulated' && query.mode === 'expo-go') {
    return <AndroidSimulatedExpoGo />;
  }

  if (
    query.platform === 'ios' &&
    query.device === 'physical' &&
    query.mode === 'development-build'
  ) {
    if (query.buildEnv === 'local') {
      return <IosPhysicalDevelopmentBuildLocal />;
    }

    return <IosPhysicalDevelopmentBuild />;
  }

  if (
    query.platform === 'ios' &&
    query.device === 'simulated' &&
    query.mode === 'development-build'
  ) {
    if (query.buildEnv === 'local') {
      return <IosSimulatedDevelopmentBuildLocal />;
    }

    return <IosSimulatedDevelopmentBuild />;
  }

  if (query.platform === 'ios' && query.device === 'physical' && query.mode === 'expo-go') {
    return <IosPhysicalExpoGo />;
  }

  if (query.platform === 'ios' && query.device === 'simulated' && query.mode === 'expo-go') {
    return <IosSimulatedExpoGo />;
  }
}
