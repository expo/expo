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
