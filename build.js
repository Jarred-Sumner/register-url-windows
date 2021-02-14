const { build } = require("esbuild");

build({
  bundle: true,
  target: ["node12"],
  entryPoints: ["./src/index.ts"],
  outfile: "./index.js",
  platform: "node",
  define: {
    "process.env.UAC_VERSION": `"${
      require("./packages/register-url-win64-bin-uac/package.json").version
    }"`,
  },
  external: [
    "path",
    "fs",
    "child_process",
    "register-url-win64-bin",
    ...Object.keys(require("./package.json").dependencies),
    ...Object.keys(require("./package.json").devDependencies),
  ],
  minify: false,
}).then((a) => console.log("Built.", a.warnings, a.outputFiles));
