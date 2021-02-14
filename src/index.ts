import childProcess from "child_process";
import * as path from "path";
import * as fs from "fs";
import which from "which";

const ELEVATE_SCRIPT_PATH = path.join(
  __dirname,
  "../bin",
  "elevate",
  "elevate.cmd"
);

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

export async function installBin() {
  const npm = await which("npm");

  return new Promise((resolve, reject) => {
    const child = childProcess.exec(
      `"${npm}" install register-url-win64-bin@1.0.0`,
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
  let downloadBin;
  try {
    downloadBin = require("register-url-win64-bin");
  } catch (exception) {
    return Promise.reject(
      `Please install "register-url-win64-bin" into ${path.resolve(
        __dirname
      )} before running this function. For convienience, you can call installBin()`
    );
  }

  await fs.promises.access(downloadBin, fs.constants.F_OK);
  if (typeof request.register === "undefined") {
    request.register = true;
  }

  return new Promise((resolve, reject) => {
    childProcess.exec(
      `"${ELEVATE_SCRIPT_PATH}" "${downloadBin}" ${JSON.stringify(
        JSON.parse(JSON.stringify(request))
      )}`,
      {
        env: process.env,
      },
      (err, stdout: string, stderr: string) => {
        if (err) {
          resolve({
            error: err.message,
            exception: err,
            chrome: false,
            edge: false,
            protocol: false,
          });
          return;
        }
        let response: RegistrationResponse;
        try {
          response = JSON.parse(stdout);
        } catch (exception) {
          if (process.env.NODE_ENV === "development") {
            console.error(exception);
          }

          if (stderr) {
            resolve({
              error: stderr,
              chrome: false,
              edge: false,
              protocol: false,
            });
          } else {
            resolve({
              error: "Unknown error ocurred",
              chrome: false,
              edge: false,
              protocol: false,
            });
          }
          return;
        }

        if (response.error && !response.error.trim().length) {
          response.error = false;
        }

        if (stderr?.length && !response.error) {
          response.error = stderr;
        }

        resolve(response);
      }
    );
  });
}
