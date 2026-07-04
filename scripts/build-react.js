const { spawnSync } = require("child_process");
const path = require("path");

process.env.CI = "false";
process.env.DISABLE_ESLINT_PLUGIN = process.env.DISABLE_ESLINT_PLUGIN || "false";

const reactScriptsBin = path.join(
  __dirname,
  "..",
  "node_modules",
  ".bin",
  process.platform === "win32" ? "react-scripts.cmd" : "react-scripts"
);

const result = spawnSync(reactScriptsBin, ["build"], {
  stdio: "inherit",
  shell: false,
  env: process.env,
});

process.exit(result.status || 0);
