import { Tools } from '../apple';
// Compile-only checks for the published exports. Jest does not execute this file.
import {
  generateAsync,
  type LanguageModelSession,
  type NumericSchemaOptions,
  type ToolDefinition,
} from '../index';

export const numericOptions: NumericSchemaOptions = { minimum: 0, maximum: 1 };

const schema = {
  type: 'object',
  properties: {
    category: { type: 'string', enum: ['work', 'other'] },
    title: { type: 'string' },
  },
  required: ['category'],
  additionalProperties: false,
} as const;

export async function checkPublicTypes(session: LanguageModelSession) {
  const imageResult = await generateAsync('Read this image.', {
    images: [{ uri: 'file:///app/receipt.png', label: 'receipt' }],
    tools: [Tools.ocr, Tools.barcode],
    schema,
  });
  const imageCategory: 'work' | 'other' = imageResult.value.category;
  const tokens: number | null | undefined = imageResult.usage.contextTokens;
  const namedOptions = { schema, maximumOutputTokens: 128 } as const;
  const result = await session.generateAsync('text', namedOptions);
  const category: 'work' | 'other' = result.value.category;
  const title: string | undefined = result.value.title;
  // @ts-expect-error The structured result cannot accidentally select the text overload.
  const text: string = result.value;
  const repairOptions = { schema, maximumRetries: 1 } as const;
  await session.generateAsync('text', repairOptions);
  session.generateStream('text', repairOptions);
  // @ts-expect-error Implementation selection is automatic.
  await session.generateAsync('text', { schema, mode: 'validated' });
  for await (const event of session.generateStream('text', namedOptions)) {
    if (event.type === 'result') {
      const streamed: 'work' | 'other' = event.result.value.category;
      return { category, title, streamed, text, imageCategory, tokens };
    }
  }
  return undefined;
}

export const typedTool: ToolDefinition<typeof schema> = {
  name: 'lookup',
  description: 'Look up a local category.',
  inputSchema: schema,
  async execute(input) {
    const category: 'work' | 'other' = input.category;
    // @ts-expect-error No undeclared tool argument exists.
    const missing: string = input.missing;
    return `${category}: ${missing}`;
  },
};
