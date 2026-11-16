// Compile-only checks for inference through the actual public entry point.
import {
  categorizeAsync,
  createSessionAsync,
  generateAsync,
  schema,
  summarizeAsync,
  type InferSchema,
  type SessionOptions,
  type ToolDefinition,
} from '../index';

const lookupInput = schema.object({
  query: schema.string(),
  limit: schema.optional(schema.integer()),
});
const saveInput = schema.object({
  title: schema.string(),
  category: schema.enum(['work', 'personal']),
});

interface Note {
  title: string;
  tags: string[];
}
const lookup: ToolDefinition<typeof lookupInput> = {
  name: 'lookup',
  description: 'Find notes.',
  inputSchema: lookupInput,
  execute(input, { signal, callId }) {
    const query: string = input.query;
    const limit: number | undefined = input.limit;
    // @ts-expect-error Schema-derived arguments must not become any.
    const wrong: number = input.query;
    // @ts-expect-error Undeclared arguments do not exist.
    input.missing;
    const result: Note = {
      title: query,
      tags: [callId, String(limit), String(signal.aborted), String(wrong)],
    };
    return result;
  },
};
const save: ToolDefinition<typeof saveInput> = {
  name: 'save',
  description: 'Save a note.',
  inputSchema: saveInput,
  execute({ title, category }) {
    const precise: 'work' | 'personal' = category;
    // @ts-expect-error Heterogeneous tools retain their own argument types.
    const wrong: number = title;
    return { title, category: precise, wrong };
  },
};
const heterogeneous = [lookup, save];
const namedOptions: SessionOptions = { tools: heterogeneous };

type Lookup = InferSchema<typeof lookupInput>;
const optionalMayBeAbsent: Lookup = { query: 'note' };
// @ts-expect-error Helpers make properties required by default.
const missingRequired: Lookup = { limit: 2 };
// @ts-expect-error Optional markers are properties, not standalone schema values.
schema.array(schema.optional(schema.string()));

export async function checkFoundationTypes() {
  await createSessionAsync(namedOptions);
  await createSessionAsync({ tools: heterogeneous });
  await generateAsync('Find notes.', { tools: heterogeneous });
  const result = await generateAsync('Summarize notes.', {
    schema: schema.object({
      title: schema.string(),
      category: schema.enum(['work', 'personal']),
      tags: schema.array(schema.string()),
      subtitle: schema.optional(schema.string()),
    }),
    tools: [
      lookup,
      {
        name: 'inline',
        description: 'Find a count.',
        inputSchema: schema.object({ count: schema.integer() }),
        execute(input, context) {
          const count: number = input.count;
          const signal: AbortSignal = context.signal;
          // @ts-expect-error Inline argument inference must not become any.
          const wrong: string = input.count;
          // @ts-expect-error An inline tool does not inherit another tool's input.
          input.query;
          return { count, cancelled: signal.aborted, wrong };
        },
      },
      save,
    ],
  });
  const title: string = result.value.title;
  const category: 'work' | 'personal' = result.value.category;
  const subtitle: string | undefined = result.value.subtitle;
  const tags: string[] = result.value.tags;
  // @ts-expect-error Structured results cannot fall back to an untyped text overload.
  const wrongResult: string = result.value;
  const text = await generateAsync('Write a title.');
  const textValue: string = text.value;
  const summary = await summarizeAsync('Notes.', {
    length: 'short',
    tools: heterogeneous,
  });
  const summaryValue: string = summary.value;
  const classified = await categorizeAsync('Email.', {
    categories: ['work', 'personal'],
    tools: heterogeneous,
  });
  const categoryValue: 'work' | 'personal' = classified.value;
  // @ts-expect-error Categories preserve exact literal values without as const.
  const invalidCategory: 'other' = classified.value;
  await categorizeAsync('Email.', {
    categories: ['work', 'personal'],
    maximumRetries: 1,
  });
  await categorizeAsync('Email.', {
    categories: ['work', 'personal'],
    maximumRetries: 1,
  });
  await generateAsync('Email.', { schema: schema.string(), maximumRetries: 1 });
  return {
    title,
    category,
    subtitle,
    tags,
    wrongResult,
    textValue,
    summaryValue,
    categoryValue,
    invalidCategory,
    optionalMayBeAbsent,
    missingRequired,
  };
}
