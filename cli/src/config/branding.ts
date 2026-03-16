export const PUBLIC_PRODUCT_NAME = "Papertape";
export const PUBLIC_CLI_NAME = "papertape";
export const PUBLIC_NPM_PACKAGE_NAME = "papertape";

export function publicCliCommand(command = ""): string {
  return [PUBLIC_CLI_NAME, command].filter(Boolean).join(" ");
}
