export function parseTrpcConfig(configContent: string) {
  // THIS IS HACKY AND SHOULD BE FIXED TO PARSE THE CONFIG FILE CORRECTLY
  /**
   * export default defineConfig({
   *   drift: {
   *     schemaPath: "__trpc/schema.bin",
   *   },
   *  });
   */

  const pattern =
    /drift:\s*{\s*schemaPath:\s*(?:"|')(?<path>[^"'}\s]+)(?:"|')/i;
  const match = configContent.match(pattern);

  const schemaPath = match?.groups?.path ?? "trpc/schema.bin";
  return {
    schemaPath,
  };
}
