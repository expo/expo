const { EXPO_PUBLIC_API_URL } = process.env;
const key = 'EXPO_PUBLIC_KEY';

export const apiUrl = EXPO_PUBLIC_API_URL;
export const bracketed = process.env['EXPO_PUBLIC_TOKEN'];
export const dynamic = process.env[key];
export const fine = process.env.EXPO_PUBLIC_FINE;
