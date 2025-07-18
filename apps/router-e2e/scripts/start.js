#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const EXPO_CLI_BIN = require.resolve('@expo/cli/build/bin/cli');

// Define known scenario configurations (these should probably live next to each scenario)
const knownConfigs = {
  '01-rsc': {
    env: {
      E2E_RSC_ENABLED: '1',
      E2E_ROUTER_JS_ENGINE: 'hermes',
      E2E_CANARY_ENABLED: '1',
      EXPO_USE_STATIC: 'server',
    },
  },
  '02-server-actions': {
    env: {
      E2E_SERVER_FUNCTIONS: '1',
      E2E_RSC_ENABLED: '1',
      E2E_ROUTER_JS_ENGINE: 'hermes',
      EXPO_USE_METRO_REQUIRE: '1',
      E2E_CANARY_ENABLED: '1',
      EXPO_USE_STATIC: 'server',
    },
  },
  '03-server-actions-only': {
    env: {
      E2E_SERVER_FUNCTIONS: '1',
      E2E_ROUTER_JS_ENGINE: 'hermes',
      EXPO_USE_METRO_REQUIRE: '1',
      E2E_CANARY_ENABLED: '1',
      EXPO_USE_STATIC: 'single',
    },
  },
  '04-server-error-boundaries': {
    env: {
      E2E_SERVER_FUNCTIONS: '1',
      E2E_ROUTER_JS_ENGINE: 'hermes',
      EXPO_USE_METRO_REQUIRE: '1',
      E2E_CANARY_ENABLED: '1',
      EXPO_USE_STATIC: 'single',
    },
  },
  '05-use-dom': {
    options: ['-d'],
  },
  'react-native-canary': {
    env: {
      E2E_RSC_ENABLED: '1',
      E2E_CANARY_ENABLED: '1',
    },
  },
  'web-workers': {
    env: {
      E2E_ROUTER_ASYNC: 'development',
      EXPO_USE_STATIC: 'single',
    },
  },
  'universal-linking': {
    env: {
      EXPO_USE_STATIC: 'server',
      EXPO_TUNNEL_SUBDOMAIN: 'expo-e2e-universal-linking',
    },
    options: ['--tunnel'],
  },
  headless: {
    command: 'expo', // No start command
  },
  'web-modal': {
    env: {
      E2E_ROUTER_JS_ENGINE: 'hermes',
      EXPO_WEB_DEV_HYDRATE: '1',
    },
  },
  'fast-refresh': {
    env: {
      E2E_ROUTER_JS_ENGINE: 'hermes',
      E2E_CANARY_ENABLED: '1',
      EXPO_USE_METRO_REQUIRE: '1',
    },
    options: ['-p', 'web'],
  },
  'static-redirects': {
    env: {
      NODE_ENV: 'production',
      EXPO_USE_STATIC: 'server',
      E2E_ROUTER_SRC: 'static-redirects',
    },
  },
};

// Get all available scenarios from the __e2e__ directory
function getAvailableScenarios() {
  const e2eDir = path.join(__dirname, '..', '__e2e__');
  const scenarios = [];

  try {
    const entries = fs.readdirSync(e2eDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const appDir = path.join(e2eDir, entry.name, 'app');
        // Check if it has an app directory (indicating it's a valid scenario)
        if (fs.existsSync(appDir)) {
          scenarios.push(entry.name);
        }
      }
    }
  } catch (error) {
    console.error('Error reading __e2e__ directory:', error.message);
  }

  return scenarios.sort();
}

// Get configuration for a scenario
function getScenarioConfig(scenario) {
  // Start with a default configuration
  const config = {
    env: {
      E2E_ROUTER_SRC: scenario,
    },
    options: [],
  };

  // Merge with known configuration, if it exists
  if (knownConfigs[scenario]) {
    const known = knownConfigs[scenario];
    config.env = { ...config.env, ...known.env };
    config.options = known.options || config.options;
    config.command = known.command;
  }

  return config;
}

// Parse command line arguments
const args = process.argv.slice(2);
const scenario = args[0];
const extraArgs = args.slice(1);

// Get all available scenarios
const availableScenarios = getAvailableScenarios();

// Show usage if no scenario provided
if (!scenario || scenario === '--help' || scenario === '-h') {
  console.log('Usage: node scripts/start.js <scenario> [options]');
  console.log('\nAvailable scenarios:');
  availableScenarios.forEach((name) => {
    const hasConfig = knownConfigs[name] ? ' (configured)' : '';
    console.log(`  ${name}${hasConfig}`);
  });
  console.log('\nExample:');
  console.log('  node scripts/start.js 01-rsc');
  console.log('  node scripts/start.js 05-use-dom --clear');
  console.log('  node scripts/start.js static-rendering');
  process.exit(0);
}

// Check if scenario exists
if (!availableScenarios.includes(scenario)) {
  console.error(`Unknown scenario: ${scenario}`);
  console.log('Available scenarios:', availableScenarios.join(', '));
  process.exit(1);
}

// Get scenario configuration
const config = getScenarioConfig(scenario);

// Build the command
const commandOptions = [];
if (!config.command || config.command === 'expo') {
  commandOptions.push('start');
}

// Add scenario-specific options
if (config.options) {
  commandOptions.push(...config.options);
}

// Add any extra arguments passed from the CLI
commandOptions.push(...extraArgs);

// Build environment variables
const env = {
  ...process.env,
  ...config.env,
};

console.log(`Starting scenario: ${scenario}`);
console.log(`Command: node ${EXPO_CLI_BIN} ${commandOptions.join(' ')}`);
if (Object.keys(config.env).length > 0) {
  console.log('Environment variables:');
  Object.entries(config.env).forEach(([key, value]) => {
    console.log(`  ${key}=${value}`);
  });
}
console.log('\n');

// Spawn the process
// const child = spawn('yarn', ['expo', ...commandOptions], {
const child = spawn(EXPO_CLI_BIN, [...commandOptions], {
  env,
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
});

// Handle process exit
child.on('error', (error) => {
  console.error(`Failed to start process: ${error.message}`);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
