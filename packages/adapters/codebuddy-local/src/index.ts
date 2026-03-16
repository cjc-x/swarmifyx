export const type = "codebuddy_local";
export const label = "CodeBuddy (local)";
export const DEFAULT_CODEBUDDY_LOCAL_MODEL = "glm-5.0";
export const DEFAULT_CODEBUDDY_LOCAL_SKIP_PERMISSIONS = true;

const CODEBUDDY_MODEL_IDS = [
  "glm-5.0",
  "glm-4.7",
  "minimax-m2.5",
  "kimi-k2.5",
  "deepseek-v3-2-volc",
  "hunyuan-2.0-thinking",
] as const;

export const models = CODEBUDDY_MODEL_IDS.map((id) => ({ id, label: id }));

export const agentConfigurationDoc = `# codebuddy_local agent configuration

Adapter: codebuddy_local

Use when:
- You want Papertape to run CodeBuddy CLI locally on the host machine
- You want CodeBuddy conversation resume across wake-ups via --resume
- You want CodeBuddy's local multi-model runtime with structured stream-json logs

Don't use when:
- You need webhook-style or remote gateway invocation (use openclaw_gateway or http)
- You only need a one-shot process execution (use process)
- CodeBuddy CLI is not installed or authenticated on the machine

Core fields:
- cwd (string, optional): default absolute working directory fallback for the agent process
- instructionsFilePath (string, optional): absolute path to a markdown instructions file prepended to the run prompt
- promptTemplate (string, optional): run prompt template
- model (string, optional): CodeBuddy model id (defaults to glm-5.0)
- effort (string, optional): CodeBuddy reasoning effort (low|medium|high|xhigh)
- maxTurnsPerRun (number, optional): passed as --max-turns when greater than zero
- dangerouslySkipPermissions (boolean, optional): auto-add -y unless permission flags are already present
- command (string, optional): defaults to "codebuddy"
- extraArgs (string[], optional): additional CLI args
- env (object, optional): KEY=VALUE environment variables

Operational fields:
- timeoutSec (number, optional): run timeout in seconds
- graceSec (number, optional): termination grace period in seconds

Notes:
- Runs are executed with: codebuddy -p --output-format stream-json ...
- Prompts are piped to CodeBuddy via stdin.
- Sessions are resumed with --resume when stored session cwd matches current cwd.
- Papertape auto-injects shared skills into "~/.codebuddy/skills" when missing so CodeBuddy can discover "$papertape" and related skills on local runs.
- Papertape auto-adds -y unless one of -y, --dangerously-skip-permissions, or --permission-mode is already present in extraArgs.
`;
