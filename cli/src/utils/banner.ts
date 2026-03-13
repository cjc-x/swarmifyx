import pc from "picocolors";
import { PUBLIC_PRODUCT_NAME } from "../config/branding.js";

const TAGLINE = "Orchestrate Your Zero-Human Company.";

export function printPaperclipCliBanner(): void {
  const lines = [
    "",
    pc.bold(pc.cyan(`  ${PUBLIC_PRODUCT_NAME}`)),
    pc.blue("  ───────────────────────────────────────────────────────"),
    pc.bold(pc.white(`  ${TAGLINE}`)),
    "",
  ];

  console.log(lines.join("\n"));
}
