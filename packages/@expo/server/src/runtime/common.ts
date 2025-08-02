export const logApiRouteExecutionError = () => (error: Error) => {
  console.error(error);
};

export const handleApiRouteError = () => async (error: Error) => {
  if ('statusCode' in error && typeof error.statusCode === 'number') {
    return new Response(error.message, {
      status: error.statusCode,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
  return new Response('Internal server error', {
    status: 500,
    headers: { 'Content-Type': 'text/plain' },
  });
};
