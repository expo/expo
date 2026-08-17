export const CLI_FEEDBACK_MAX_LENGTH = 5_000;
export const CLI_FEEDBACK_CATEGORIES = [
  'skills',
  'expo-cli',
  'eas-cli',
  'mcp',
  'docs',
  'evals',
  'simulator',
  'unknown',
] as const;

export type CliFeedbackCategory = (typeof CLI_FEEDBACK_CATEGORIES)[number];

export type CliFeedbackContextMetadata = {
  category: CliFeedbackCategory;
  feedbackId: string;
  subject?: string;
};

export type CliFeedbackAgentEnvironment =
  | { detected: false }
  | {
      detected: true;
      agent: {
        id: string;
        name: string;
        sessionId?: string;
      };
    };

export type CliFeedbackSandboxEnvironment =
  | { detected: false }
  | {
      detected: true;
      sandbox: {
        id: string;
        name: string;
      };
    };

export type CliFeedbackProjectMetadata =
  | { isExpoProject: false }
  | {
      isExpoProject: true;
      name?: string;
      slug?: string;
      sdkVersion?: string;
      platforms?: string[];
      expoPackageVersion?: string;
      reactNativePackageVersion?: string;
      expoRouterPackageVersion?: string;
    };

export type CliFeedbackTelemetryMetadata = {
  cli: {
    name: 'submit-expo-feedback';
    version: string;
  };
  agentEnvironment: CliFeedbackAgentEnvironment;
  sandboxEnvironment: CliFeedbackSandboxEnvironment;
  ci?: {
    name: string | null;
    isPr: boolean | null;
  };
  device: {
    arch: string;
    platform: NodeJS.Platform;
  };
  node: {
    version: string;
  };
  packageManager: string | null;
  project: CliFeedbackProjectMetadata;
};

export type CliFeedbackMetadata =
  | CliFeedbackContextMetadata
  | (CliFeedbackContextMetadata & CliFeedbackTelemetryMetadata);

export type CliFeedbackRequest = {
  feedback: string;
  metadata: CliFeedbackMetadata;
};
