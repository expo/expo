import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { selectSandboxPresets } from './presets';

describe('Sandbox preset selection', () => {
  it('should select node install and package scripts from package json', () => {
    const presets = selectSandboxPresets({
      files: {
        'package.json': JSON.stringify({
          scripts: {
            test: 'node --test',
            lint: 'eslint .',
            typecheck: 'tsc --noEmit',
          },
        }),
        'pnpm-lock.yaml': 'lockfileVersion: 9',
      },
    });

    assert.deepEqual(presets, [
      'checkout',
      'node_install',
      'node_test',
      'node_lint',
      'node_typecheck',
    ]);
  });

  it('should select gradle swift and cmake presets from project files', () => {
    const presets = selectSandboxPresets({
      files: {
        gradlew: '#!/bin/sh',
        'Package.swift': '// swift-tools-version: 6.0',
        'CMakeLists.txt': 'cmake_minimum_required(VERSION 3.22)',
      },
    });

    assert.deepEqual(presets, ['checkout', 'gradle_check', 'swift_check', 'cpp_check']);
  });

  it('should fall back to checkout for unknown stacks', () => {
    assert.deepEqual(selectSandboxPresets({ files: { 'go.mod': 'module example.com/app' } }), [
      'checkout',
    ]);
  });

  it('should select typecheck when tsconfig exists without a script', () => {
    const presets = selectSandboxPresets({
      files: {
        'package.json': JSON.stringify({ scripts: {} }),
        'tsconfig.json': '{}',
      },
    });

    assert.deepEqual(presets, ['checkout', 'node_install', 'node_typecheck']);
  });
});
