let embeddingPipeline: any = null;

export async function embedText(text: string): Promise<number[]> {
  if (!embeddingPipeline) {
    const { pipeline } = await import('@xenova/transformers');
    embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  // The pipeline returns [1, N, D] shape, so we flatten to [D]
  const output = await embeddingPipeline(text, {
    pooling: 'mean',
    normalize: true,
  });
  return Array.from(output.data);
}
