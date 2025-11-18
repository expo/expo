import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';

export interface CreateOptions {
  projectName: string;
  template: string;
  skipPrompts: boolean;
}

export async function createMiniAppContainer(options: CreateOptions) {
  const { projectName } = options;

  const spinner = ora('Creating MiniApp Container...').start();

  try {
    // 1. Create project directory
    const projectPath = path.join(process.cwd(), projectName);

    if (fs.existsSync(projectPath)) {
      throw new Error(`Directory "${projectName}" already exists`);
    }

    fs.mkdirSync(projectPath, { recursive: true });
    spinner.text = 'Project directory created';

    // 2. Create project structure
    await createProjectStructure(projectPath, options);
    spinner.text = 'Project structure created';

    // 3. Create package.json
    createPackageJson(projectPath, projectName);
    spinner.text = 'package.json created';

    // 4. Create app.json
    createAppJson(projectPath, projectName);
    spinner.text = 'app.json created';

    // 5. Create source files
    createSourceFiles(projectPath);
    spinner.text = 'Source files created';

    // 6. Create README
    createReadme(projectPath, projectName);
    spinner.text = 'README.md created';

    spinner.succeed(chalk.green('Project files created'));

    // 7. Initialize git
    const gitSpinner = ora('Initializing git repository...').start();
    try {
      execSync('git init', { cwd: projectPath, stdio: 'ignore' });
      gitSpinner.succeed('Git repository initialized');
    } catch (error) {
      gitSpinner.warn('Could not initialize git repository');
    }

  } catch (error) {
    spinner.fail('Failed to create project');
    throw error;
  }
}

function createProjectStructure(projectPath: string, options: CreateOptions) {
  const directories = [
    'src',
    'src/components',
    'src/screens',
    'src/navigation',
    'src/services',
    'assets',
    'assets/images',
    'assets/fonts',
  ];

  directories.forEach((dir) => {
    fs.mkdirSync(path.join(projectPath, dir), { recursive: true });
  });
}

function createPackageJson(projectPath: string, projectName: string) {
  const packageJson = {
    name: projectName,
    version: '0.1.0',
    main: 'expo-router/entry',
    scripts: {
      start: 'expo start',
      android: 'expo run:android',
      ios: 'expo run:ios',
      web: 'expo start --web',
      prebuild: 'expo prebuild',
      'prebuild:clean': 'expo prebuild --clean',
      lint: 'eslint .',
      test: 'jest',
    },
    dependencies: {
      expo: '~52.0.0',
      'expo-dev-miniapp-launcher': 'file:../../expo/packages/expo-dev-miniapp-launcher',
      'expo-status-bar': '~2.0.0',
      react: '18.3.1',
      'react-native': '0.76.5',
      'react-native-safe-area-context': '4.12.0',
      'react-native-screens': '~4.4.0',
    },
    devDependencies: {
      '@babel/core': '^7.25.2',
      '@types/react': '~18.3.12',
      typescript: '^5.3.3',
    },
    private: true,
  };

  fs.writeFileSync(
    path.join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
}

function createAppJson(projectPath: string, projectName: string) {
  const appJson = {
    expo: {
      name: projectName,
      slug: projectName,
      version: '1.0.0',
      orientation: 'portrait',
      icon: './assets/icon.png',
      userInterfaceStyle: 'light',
      splash: {
        image: './assets/splash.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
      },
      assetBundlePatterns: ['**/*'],
      ios: {
        supportsTablet: true,
        bundleIdentifier: `com.miniapp.${projectName.replace(/-/g, '')}`,
      },
      android: {
        adaptiveIcon: {
          foregroundImage: './assets/adaptive-icon.png',
          backgroundColor: '#ffffff',
        },
        package: `com.miniapp.${projectName.replace(/-/g, '')}`,
      },
      web: {
        favicon: './assets/favicon.png',
      },
      plugins: [
        [
          'expo-dev-miniapp-launcher',
          {
            enabled: true,
            launchMode: 'launcher',
          },
        ],
      ],
    },
  };

  fs.writeFileSync(
    path.join(projectPath, 'app.json'),
    JSON.stringify(appJson, null, 2)
  );
}

function createSourceFiles(projectPath: string) {
  // Create App.tsx
  const appTsx = `import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚀 MiniApp Container</Text>
      <Text style={styles.subtitle}>Ready to load mini-apps!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});
`;

  fs.writeFileSync(path.join(projectPath, 'App.tsx'), appTsx);

  // Create tsconfig.json
  const tsConfig = {
    extends: 'expo/tsconfig.base',
    compilerOptions: {
      strict: true,
    },
  };

  fs.writeFileSync(
    path.join(projectPath, 'tsconfig.json'),
    JSON.stringify(tsConfig, null, 2)
  );

  // Create .gitignore
  const gitignore = `# Dependencies
node_modules/

# Expo
.expo/
dist/
web-build/

# Native
*.orig.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision

# Metro
.metro-health-check*

# Debug
npm-debug.*
yarn-debug.*
yarn-error.*

# macOS
.DS_Store
*.pem

# Local env files
.env*.local

# Typescript
*.tsbuildinfo
`;

  fs.writeFileSync(path.join(projectPath, '.gitignore'), gitignore);

  // Create babel.config.js
  const babelConfig = `module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
`;

  fs.writeFileSync(path.join(projectPath, 'babel.config.js'), babelConfig);
}

function createReadme(projectPath: string, projectName: string) {
  const readme = `# ${projectName}

A MiniApp Container built with Expo and React Native.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- Android Studio (for Android) or Xcode (for iOS)

### Installation

\`\`\`bash
npm install
\`\`\`

### Development

\`\`\`bash
# Start the development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
\`\`\`

## 📦 Project Structure

\`\`\`
${projectName}/
├── src/
│   ├── components/     # Reusable components
│   ├── screens/        # Screen components
│   ├── navigation/     # Navigation configuration
│   └── services/       # Business logic and services
├── assets/            # Images, fonts, etc.
├── App.tsx           # Main app component
└── app.json          # Expo configuration
\`\`\`

## 🔧 Features

- ✅ Expo SDK 52
- ✅ TypeScript support
- ✅ Expo Dev Client for custom development builds
- ✅ Ready for bare workflow customization

## 📝 Next Steps

1. Customize the dev launcher UI in \`expo-dev-launcher\`
2. Add mini-app loading functionality
3. Implement offline package management
4. Add custom APIs for mini-apps

## 📚 Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Dev Client](https://docs.expo.dev/develop/development-builds/introduction/)

## 📄 License

MIT
`;

  fs.writeFileSync(path.join(projectPath, 'README.md'), readme);
}
