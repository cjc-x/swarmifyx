import type { UIAdapterModule } from "../types";
import { parseCodeBuddyStdoutLine, buildCodeBuddyLocalConfig } from "@papertape/adapter-codebuddy-local/ui";
import { CodeBuddyLocalConfigFields } from "./config-fields";

export const codeBuddyLocalUIAdapter: UIAdapterModule = {
  type: "codebuddy_local",
  label: "CodeBuddy (local)",
  parseStdoutLine: parseCodeBuddyStdoutLine,
  ConfigFields: CodeBuddyLocalConfigFields,
  buildAdapterConfig: buildCodeBuddyLocalConfig,
};
