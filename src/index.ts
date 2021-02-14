import childProcess from "child_process";
import * as path from "path";
import * as fs from "fs";
import which from "which";
import util from "util";
import tmp from "tmp-promise";
const exec = util.promisify(childProcess.exec);

export type RegistrationRequest = {
  /* path to application to run */
  path: string;
  /* name used in registry entry */
  name?: string;
  /* protocol to register. valid protocol: "git-peek". invalid protocol: "git-peek://" */
  protocol: string;
  /* list of domain names to allowlist 1-click open in Chrome/Edge */
  origins?: string[];
  /* Register the path */
  register: boolean;
  output?: string;
};

export type RegistrationResponse = {
  /* Was there an error? */
  error: false | string;
  /* Did it add to chrome's allowlist? */
  chrome: boolean;
  /* Did it add to edge's allowlist? */
  edge: boolean;
  /* Did it register the protocol? */
  protocol: boolean;
  /* Do we have an exception to report? */
  exception?: Error;
};

export async function installBin(requireUAC = true) {
  const npm = await which("npm");

  const packageName = requireUAC
    ? "register-url-win64-bin-uac"
    : "register-url-win64-bin";

  return new Promise((resolve, reject) => {
    const child = childProcess.exec(
      `"${npm}" install  ${packageName}@${process.env.UAC_VERSION} --legacy-peer-deps --production --no-fund --no-audit --no-package-lock --ignore-scripts --no-save`,
      { cwd: path.resolve(__dirname) },
      (err, stdout, stderr) => (err ? reject(err) : resolve({ stdout, stderr }))
    );
    child.stdout.pipe(process.stdout);
    child.stdin.pipe(process.stdin);
  });
}

export async function register(
  request: RegistrationRequest
): Promise<RegistrationResponse> {
  let uac = (request.origins?.length ?? 0) > 0;
  let packageName = uac
    ? "register-url-win64-bin-uac"
    : "register-url-win64-bin";
  let downloadBin;
  try {
    downloadBin = require(packageName);
  } catch (exception) {
    return Promise.reject(
      `Please install "${packageName}" into ${path.resolve(
        __dirname
      )} before running this function. For convienience, you can call installBin()`
    );
  }

  await fs.promises.access(downloadBin, fs.constants.F_OK);
  if (typeof request.register === "undefined") {
    request.register = true;
  }

  if (!request.output) {
    const { path: filePath } = await tmp.file({
      discardDescriptor: true,
      postfix: ".json",
    });

    request.output = filePath;
  }

  request.output = path.resolve(request.output);

  try {
    const { stdout, stderr } = await exec(
      `"${downloadBin}" ${JSON.stringify(JSON.parse(JSON.stringify(request)))}`,
      {
        env: process.env,
        windowsHide: true,
      }
    );
    let response: RegistrationResponse;

    try {
      response = JSON.parse(
        await fs.promises.readFile(request.output, "utf-8")
      );

      if (typeof response !== "object") {
        throw "Empty response";
      }
    } catch (exception) {
      process.stdout.write("\n" + stdout);

      if (stderr) {
        return {
          error: stderr + " \n\n",
          chrome: false,
          edge: false,
          protocol: false,
        };
      } else {
        return {
          error: stdout,
          chrome: false,
          edge: false,
          protocol: false,
        };
      }
    }

    if (response.error && !response.error.trim().length) {
      response.error = false;
    }

    return response;
  } catch (err) {
    return Promise.resolve({
      error: err.message,
      exception: err,
      chrome: false,
      edge: false,
      protocol: false,
    });
  }
}
