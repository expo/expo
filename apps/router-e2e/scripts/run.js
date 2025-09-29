#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
// TODO(@hassankhan): Use @expo/env
const dotenv = require('dotenv');

const EXPO_CLI_BIN = require.resolve('@expo/cli/build/bin/cli');

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

// Gets a default configuration for a scenario
function getScenarioConfig(scenario) {
  return {
    env: {
      E2E_ROUTER_SRC: scenario,
    },
    options: [],
  };
}

// Parse command line arguments
const args = process.argv.slice(2);
const scenario = args[0];

// Check if command is set via environment variable (e.g. from npm scripts)
let command = process.env.EXPO_COMMAND || 'start';
let extraArgs = args.slice(1);

// Check if second argument is a command (start/export) to allow direct CLI usage
if (args[1] === 'start' || args[1] === 'export') {
  command = args[1];
  extraArgs = args.slice(2);
}


const availableScenarios = getAvailableScenarios();

if (!scenario || scenario === '--help' || scenario === '-h') {
  console.log('Usage: node scripts/run.js <scenario> [command] [options]');
  console.log('\nCommands:');
  console.log('  start   Start the development server (default)');
  console.log('  export  Export the app for production');
  console.log('\nAvailable scenarios:');
  availableScenarios.forEach((name) => {
    console.log(`  ${name}`);
  });
  console.log('\nExamples:');
  console.log('  node scripts/run.js 01-rsc');
  console.log('  node scripts/run.js 01-rsc export');
  console.log('  node scripts/run.js 05-use-dom start -d');
  console.log('  node scripts/run.js static-rendering export -p web');
  process.exit(0);
}

if (!availableScenarios.includes(scenario)) {
  console.error(`Unknown scenario: ${scenario}`);
  console.log('Available scenarios:', availableScenarios.join(', '));
  process.exit(1);
}

const config = getScenarioConfig(scenario);

// Build the command with any extra arguments passed from the CLI
const commandOptions = [command];
commandOptions.push(...extraArgs);

// Load .env file from the scenario directory if it exists
const scenarioDir = path.join(__dirname, '..', '__e2e__', scenario);
const envPath = path.join(scenarioDir, '.env');
let envVars = {};
if (fs.existsSync(envPath)) {
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.warn(`Warning: Could not parse .env file at ${envPath}:`, result.error.message);
  } else {
    envVars = result.parsed || {};
  }
}

// Build environment variables with proper precedence:
// 1. Current process.env (highest priority - passed through from command line)
// 2. .env from scenario folder
// 3. Known config env vars (lowest priority)
const env = {
  ...config.env,
  ...envVars,
  ...process.env,
};

console.log(`Running scenario: ${scenario}`);
console.log(`Command: node ${EXPO_CLI_BIN} ${commandOptions.join(' ')}`);

// Show if .env was loaded
if (Object.keys(envVars).length > 0) {
  console.log(`Loaded .env from: ${envPath}`);
}

// Show final environment variables (excluding process.env to avoid clutter)
if (Object.keys(envVars).length > 0) {
  console.log('Environment variables:');
  Object.entries(envVars).forEach(([key, value]) => {
    console.log(`  ${key}=${value} (from .env)`);
  });
  // Also show E2E_ROUTER_SRC which is always added
  console.log(`  E2E_ROUTER_SRC=${scenario}`);
}
console.log('\n');

// Spawn the process
spawn(EXPO_CLI_BIN, [...commandOptions], {
  env,
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
});
