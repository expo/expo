import { z } from 'zod';

import { createMCPDevToolsExtensionSchema } from '../createMCPDevToolsExtensionSchema';

it('preserves DevTools command constraints when exporting a Zod 4 schema', () => {
  const schema = createMCPDevToolsExtensionSchema({
    packageName: 'test-plugin',
    packageRoot: '/test-plugin',
    cliExtensions: {
      description: 'Test plugin',
      entryPoint: 'cli.js',
      commands: [
        {
          name: 'run',
          title: 'Run a task',
          environments: ['mcp'],
          parameters: [
            { name: 'name', type: 'text' },
            { name: 'count', type: 'number' },
            { name: 'confirm', type: 'confirm' },
          ],
        },
      ],
    },
  });

  expect(z.toJSONSchema(schema)).toMatchObject({
    type: 'object',
    properties: {
      command: { type: 'string', enum: ['run'] },
      name: { type: 'string' },
      count: { type: 'number' },
      confirm: { type: 'boolean' },
    },
    required: ['command'],
    additionalProperties: false,
  });
  expect(schema.safeParse({ command: 'other' }).success).toBe(false);
  expect(schema.safeParse({ command: 'run', count: '1' }).success).toBe(false);
  expect(schema.safeParse({ command: 'run', extra: true }).success).toBe(false);
});
