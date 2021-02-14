const { build } = require("esbuild");

build({
  bundle: true,
  target: ["node12"],
  entryPoints: ["./src/index.ts"],
  outfile: "./index.js",
  platform: "node",
  external: ["path", "fs", "child_process", "register-url-win64-bin", "which"],
  minify: false,
}).then((a) => console.log("Built.", a.warnings, a.outputFiles));
