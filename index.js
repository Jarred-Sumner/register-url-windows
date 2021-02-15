var __create = Object.create;
var __defProp = Object.defineProperty;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {get: all[name], enumerable: true});
};
var __exportStar = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, {get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable});
  }
  return target;
};
var __toModule = (module2) => {
  if (module2 && module2.__esModule)
    return module2;
  return __exportStar(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", {value: module2, enumerable: true})), module2);
};

// src/index.ts
__markAsModule(exports);
__export(exports, {
  installBin: () => installBin,
  register: () => register
});
var import_child_process = __toModule(require("child_process"));
var path = __toModule(require("path"));
var fs = __toModule(require("fs"));
var import_which = __toModule(require("which"));
var import_tmp_promise = __toModule(require("tmp-promise"));
async function installBin(requireUAC = true) {
  const npm = await import_which.default("npm");
  const packageName = requireUAC ? "register-url-win64-bin-uac" : "register-url-win64-bin";
  return new Promise((resolve2, reject) => {
    const child = import_child_process.default.spawn(`"${npm}"`, [
      "install",
      `${packageName}@${"1.0.2"}`,
      `--legacy-peer-deps`,
      `--production`,
      `--no-fund`,
      `--no-audit`,
      `--no-package-lock`,
      `--ignore-scripts`,
      `--no-save`
    ], {cwd: path.resolve(__dirname), detached: false});
    child.stdout.pipe(process.stdout);
    child.stdin.pipe(process.stdin);
    child.once("exit", resolve2);
    child.once("error", reject);
  });
}
async function register(request) {
  var _a, _b;
  let uac = ((_b = (_a = request.origins) == null ? void 0 : _a.length) != null ? _b : 0) > 0;
  let packageName = uac ? "register-url-win64-bin-uac" : "register-url-win64-bin";
  let downloadBin;
  try {
    downloadBin = require(packageName);
  } catch (exception) {
    return Promise.reject(`Please install "${packageName}" into ${path.resolve(__dirname)} before running this function. For convienience, you can call installBin()`);
  }
  await fs.promises.access(downloadBin, fs.constants.F_OK);
  if (typeof request.register === "undefined") {
    request.register = true;
  }
  if (!request.output) {
    const {path: filePath} = await import_tmp_promise.default.file({
      discardDescriptor: true,
      postfix: ".json"
    });
    request.output = filePath;
  }
  request.output = path.resolve(request.output);
  try {
    const child = import_child_process.default.spawn(`"${downloadBin}"`, [JSON.stringify(request)], {
      cwd: path.resolve(__dirname),
      env: process.env,
      windowsHide: true,
      detached: false,
      stdio: "inherit"
    });
    child.stdout.pipe(process.stdout);
    child.stdin.pipe(process.stdin);
    return await new Promise(async (resolve2, reject) => {
      child.once("exit", async () => {
        let response;
        try {
          response = JSON.parse(await fs.promises.readFile(request.output, "utf-8"));
          if (typeof response !== "object") {
            throw "Empty response";
          }
        } catch (exception) {
          response = {
            error: exception.message,
            exception,
            chrome: false,
            protocol: false,
            edge: false
          };
        }
        resolve2(response);
      });
    }).catch((err) => {
      return Promise.resolve({
        error: err.message,
        exception: err,
        chrome: false,
        edge: false,
        protocol: false
      });
    });
  } catch (err) {
    return Promise.resolve({
      error: err.message,
      exception: err,
      chrome: false,
      edge: false,
      protocol: false
    });
  }
}
