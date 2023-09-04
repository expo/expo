import { ExpoResponse } from 'expo-router/server';

/** @type {import('expo-router/server').RequestHandler} */
export function GET() {
  return ExpoResponse.json({
    method: 'get',
  });
}

export function POST() {
  return ExpoResponse.json({
    method: 'post',
  });
}

export function PUT() {
  return ExpoResponse.json({
    method: 'put',
  });
}

export function DELETE() {
  return ExpoResponse.json({
    method: 'delete',
  });
}

export function PATCH() {
  return ExpoResponse.json({
    method: 'patch',
  });
}

export function HEAD() {
  return ExpoResponse.json({
    method: 'head',
  });
}

export function OPTIONS() {
  return ExpoResponse.json({
    method: 'options',
  });
}

export function TRACE() {
  return ExpoResponse.json({
    method: 'trace',
  });
}

export function CONNECT() {
  return ExpoResponse.json({
    method: 'connect',
  });
}

export function ALL() {
  return ExpoResponse.json({
    method: 'all',
  });
}

export function ANY() {
  return ExpoResponse.json({
    method: 'any',
  });
}

export function MATCH() {
  return ExpoResponse.json({
    method: 'match',
  });
}

export function LINK() {
  return ExpoResponse.json({
    method: 'link',
  });
}

export function UNLINK() {
  return ExpoResponse.json({
    method: 'unlink',
  });
}
