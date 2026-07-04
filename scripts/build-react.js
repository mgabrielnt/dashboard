const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

process.env.CI = "false";
process.env.DISABLE_ESLINT_PLUGIN = process.env.DISABLE_ESLINT_PLUGIN || "false";

const rootDir = path.join(__dirname, "..");
const buildDir = path.join(rootDir, "build");
const reactScriptsBin = path.join(
  rootDir,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "react-scripts.cmd" : "react-scripts"
);

const result = spawnSync(reactScriptsBin, ["build"], {
  stdio: "inherit",
  shell: false,
  env: process.env,
});

if (result.status !== 0) {
  process.exit(result.status || 1);
}

const replacements = [
  ["http://localhost:5000", process.env.REACT_APP_API_URL || ""],
  ["http:\\/\\/localhost:5000", (process.env.REACT_APP_API_URL || "").replace(/\//g, "\\/")],
];

const patchFile = (filePath) => {
  const original = fs.readFileSync(filePath, "utf8");
  let patched = original;

  replacements.forEach(([from, to]) => {
    patched = patched.split(from).join(to);
  });

  if (patched !== original) {
    fs.writeFileSync(filePath, patched);
    console.log(`Patched API URL in ${path.relative(rootDir, filePath)}`);
  }
};

const walk = (dir) => {
  if (!fs.existsSync(dir)) return;

  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    if (/\.(js|css|html|json|map)$/.test(entry.name)) patchFile(fullPath);
  });
};

walk(buildDir);
