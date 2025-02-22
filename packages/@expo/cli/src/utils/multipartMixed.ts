import { randomBytes } from 'node:crypto';

export interface FormDataField {
  name: string;
  value: string | File | Blob;
  contentType?: string | null;
  partHeaders?: Record<string, string> | null;
}

export interface EncodedFormData {
  boundary: string;
  body: string;
}

const CRLF = '\r\n';
const BOUNDARY_HYPHEN_CHARACTERS = '-'.repeat(2);

const getFormHeader = (boundary: string, field: FormDataField): string => {
  let header = `${BOUNDARY_HYPHEN_CHARACTERS}${boundary}${CRLF}`;
  header += `Content-Disposition: form-data; name="${field.name}"`;
  if (typeof field.value !== 'string') {
    header += `; filename="${(field.value as File).name ?? 'blob'}"${CRLF}`;
    header += `Content-Type: ${field.value.type || 'application/octet-stream'}`;
  } else if (field.contentType) {
    header += `${CRLF}Content-Type: ${field.contentType}`;
  }
  if (field.partHeaders) {
    for (const headerName in field.partHeaders) {
      header += `${CRLF}${headerName}: ${field.partHeaders[headerName]}`;
    }
  }
  return `${header}${CRLF}${CRLF}`;
};

const getFormFooter = (boundary: string) =>
  `${BOUNDARY_HYPHEN_CHARACTERS}${boundary}${BOUNDARY_HYPHEN_CHARACTERS}${CRLF}${CRLF}`;

export async function encodeMultipartMixed(fields: FormDataField[]): Promise<EncodedFormData> {
  const boundary = `formdata-${randomBytes(8).toString('hex')}`;
  let body = '';
  for (const field of fields) {
    if (typeof field.value !== 'string') {
      body += getFormHeader(boundary, field);
      body += await field.value.text();
      body += CRLF;
    } else {
      body += getFormHeader(boundary, field) + field.value + CRLF;
    }
  }
  body += getFormFooter(boundary);
  return { boundary, body };
}
