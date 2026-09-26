import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/expo/expo/blob/main/packages/eslint-plugin-expo/docs/rules/${name}.md`
);

const PUBLIC_PREFIX = 'EXPO_PUBLIC_';

/**
 * Name segments that suggest a credential rather than configuration. Matched
 * against `_` separated segments so `EXPO_PUBLIC_MONKEY` does not trip on
 * "key".
 */
const SENSITIVE_SEGMENTS = [
  'key',
  'keys',
  'secret',
  'secrets',
  'token',
  'password',
  'passwd',
  'pwd',
  'credential',
  'credentials',
  'private',
  'auth',
  'apikey',
  'accesskey',
  'signature',
];

type Options = [
  {
    additionalPatterns?: string[];
    allow?: string[];
  },
];

type MessageIds = 'sensitivePublicEnvVar';

function segmentsOf(name: string): string[] {
  return name.slice(PUBLIC_PREFIX.length).toLowerCase().split('_').filter(Boolean);
}

export const noSensitivePublicEnvVar = createRule<Options, MessageIds>({
  name: 'no-sensitive-public-env-var',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Prevents credentials from being stored in EXPO_PUBLIC_ environment variables, which are inlined into the app bundle',
    },
    schema: [
      {
        type: 'object',
        properties: {
          additionalPatterns: {
            type: 'array',
            items: { type: 'string' },
          },
          allow: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      sensitivePublicEnvVar:
        '{{name}} is inlined into the app bundle in plain text and is readable by anyone who has the app. Do not store secrets in EXPO_PUBLIC_ variables. Read it on a server, or if this value is genuinely public, add it to the allow option.',
    },
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const allow = new Set(options?.allow ?? []);
    const additional = (options?.additionalPatterns ?? []).map((p) => new RegExp(p, 'i'));

    function isSensitive(name: string): boolean {
      if (allow.has(name)) {
        return false;
      }
      if (additional.some((re) => re.test(name))) {
        return true;
      }
      return segmentsOf(name).some((segment) => SENSITIVE_SEGMENTS.includes(segment));
    }

    return {
      MemberExpression(node: TSESTree.MemberExpression) {
        // process.env.EXPO_PUBLIC_X
        if (node.computed || node.property.type !== 'Identifier') {
          return;
        }

        const object = node.object;
        if (
          object.type !== 'MemberExpression' ||
          object.computed ||
          object.object.type !== 'Identifier' ||
          object.object.name !== 'process' ||
          object.property.type !== 'Identifier' ||
          object.property.name !== 'env'
        ) {
          return;
        }

        const name = node.property.name;
        if (!name.startsWith(PUBLIC_PREFIX)) {
          return;
        }

        if (isSensitive(name)) {
          context.report({
            node,
            messageId: 'sensitivePublicEnvVar',
            data: { name },
          });
        }
      },
    };
  },
});
