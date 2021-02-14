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
var ELEVATE_SCRIPT_PATH = path.join(__dirname, "../bin", "elevate", "elevate.cmd");
async function installBin() {
  const npm = await import_which.default("npm");
  return new Promise((resolve2, reject) => {
    const child = import_child_process.default.exec(`"${npm}" install register-url-win64-bin@1.0.0`, {cwd: path.resolve(__dirname)}, (err, stdout, stderr) => err ? reject(err) : resolve2({stdout, stderr}));
    child.stdout.pipe(process.stdout);
    child.stdin.pipe(process.stdin);
  });
}
async function register(request) {
  let downloadBin;
  try {
    downloadBin = require("register-url-win64-bin");
  } catch (exception) {
    return Promise.reject(`Please install "register-url-win64-bin" into ${path.resolve(__dirname)} before running this function. For convienience, you can call installBin()`);
  }
  await fs.promises.access(downloadBin, fs.constants.F_OK);
  if (typeof request.register === "undefined") {
    request.register = true;
  }
  return new Promise((resolve2, reject) => {
    import_child_process.default.exec(`"${ELEVATE_SCRIPT_PATH}" "${downloadBin}" ${JSON.stringify(JSON.parse(JSON.stringify(request)))}`, {
      env: process.env
    }, (err, stdout, stderr) => {
      if (err) {
        resolve2({
          error: err.message,
          exception: err,
          chrome: false,
          edge: false,
          protocol: false
        });
        return;
      }
      let response;
      try {
        response = JSON.parse(stdout);
      } catch (exception) {
        if (process.env.NODE_ENV === "development") {
          console.error(exception);
        }
        if (stderr) {
          resolve2({
            error: stderr,
            chrome: false,
            edge: false,
            protocol: false
          });
        } else {
          resolve2({
            error: "Unknown error ocurred",
            chrome: false,
            edge: false,
            protocol: false
          });
        }
        return;
      }
      if (response.error && !response.error.trim().length) {
        response.error = false;
      }
      if ((stderr == null ? void 0 : stderr.length) && !response.error) {
        response.error = stderr;
      }
      resolve2(response);
    });
  });
}
