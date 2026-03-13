export const PUBLIC_PRODUCT_NAME = "SwarmifyX";
export const PUBLIC_CLI_NAME = "swarmifyx";
export const PUBLIC_NPM_PACKAGE_NAME = "swarmifyx";

export function publicCliCommand(command = ""): string {
  return [PUBLIC_CLI_NAME, command].filter(Boolean).join(" ");
}
