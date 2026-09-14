import { z } from 'zod';

export const MODEL_CONTEXT_PROTOCOL_VERSION = 1;

/** Limits applied to app-supplied data. Everything from the app is untrusted input. */
export const LIMITS = {
  toolName: 64,
  description: 1024,
  inputSchemaBytes: 16 * 1024,
  stackChars: 64 * 1024,
  resultTextChars: 1024 * 1024,
  messageBytes: 2 * 1024 * 1024,
} as const;

export const ToolNameSchema = z
  .string()
  .min(1)
  .max(LIMITS.toolName)
  .regex(/^[a-zA-Z0-9_-]+$/, 'Tool names may only use a-z, A-Z, 0-9, "_" and "-".');

/**
 * `inputSchema` must be a JSON Schema for an object. `$ref` is rejected because the dev server
 * does not resolve references and an agent should not be pointed at remote schemas.
 */
export const InputSchemaSchema = z
  .object({ type: z.literal('object') })
  .passthrough()
  .superRefine((schema, ctx) => {
    const json = JSON.stringify(schema);
    if (json.length > LIMITS.inputSchemaBytes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `inputSchema is ${json.length} bytes; max is ${LIMITS.inputSchemaBytes}.`,
      });
    }
    if (json.includes('"$ref"')) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'inputSchema must not use "$ref".' });
    }
  });

export const ToolDescriptorSchema = z
  .object({
    name: ToolNameSchema,
    description: z.string().min(1).max(LIMITS.description),
    inputSchema: InputSchemaSchema,
  })
  .strict();

export type ToolDescriptor = z.infer<typeof ToolDescriptorSchema>;

export const RegisterToolParamsSchema = ToolDescriptorSchema.extend({
  stack: z.string().max(LIMITS.stackChars).optional(),
});

export type RegisterToolParams = z.infer<typeof RegisterToolParamsSchema>;

export const UnregisterToolParamsSchema = z.object({ name: ToolNameSchema }).strict();

export const HelloParamsSchema = z
  .object({
    protocolVersion: z.literal(MODEL_CONTEXT_PROTOCOL_VERSION),
    platform: z.string().max(32).optional(),
  })
  .strict();

/** Mirrors the MCP `CallToolResult`, which is also what WebMCP's `execute` returns. */
export const ToolResultSchema = z.object({
  content: z
    .array(
      z.union([
        z.object({ type: z.literal('text'), text: z.string().max(LIMITS.resultTextChars) }),
        z.object({
          type: z.literal('image'),
          data: z.string().max(LIMITS.resultTextChars),
          mimeType: z.string().max(128),
        }),
      ])
    )
    .max(100),
  isError: z.boolean().optional(),
});

export type ToolResult = z.infer<typeof ToolResultSchema>;

const MessageIdSchema = z.union([z.string().max(128), z.number()]);

/** Request from the app. Sent inside the Metro socket envelope (see `socketMessages.ts`). */
export const RequestMessageSchema = z.object({
  id: MessageIdSchema.optional(),
  method: z.string().max(64),
  params: z.unknown().optional(),
});

/** Response from the app to a `tools/call` the dev server sent. */
export const ResponseMessageSchema = z.object({
  id: MessageIdSchema,
  result: z.unknown().optional(),
  error: z.object({ code: z.number(), message: z.string().max(LIMITS.description) }).optional(),
});

export type ResponseMessage = z.infer<typeof ResponseMessageSchema>;

/** Formats Zod issues into one line for logs and error responses. */
export function formatIssues(error: z.ZodError): string {
  return error.issues
    .slice(0, 3)
    .map((issue) =>
      issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message
    )
    .join('; ');
}
