export const LINK_PROTOCOL_ALLOWLIST = {
  hosts: [
    /^localhost(:\d+)?$/i,
    /^127\.0\.0\.1(:\d+)?$/,
    /^0\.0\.0\.0(:\d+)?$/,
    /^10(?:\.\d+){3}(:\d+)?$/,
    /^192\.168\.\d+\.\d+(:\d+)?$/,
    /^169\.254\.\d+\.\d+(:\d+)?$/,
    /(^|\.)schemas\.android\.com$/i,
    /(^|\.)w3\.org$/i,
    /(^|\.)java\.sun\.com$/i,
    /\.internal$/i,
    /\.svc\.cluster\.local$/i,
    /(^|\.)example\.(com|org|net)$/i,
  ] as RegExp[],
  urls: [] as string[],
  ignorePaths: [] as string[],
};
