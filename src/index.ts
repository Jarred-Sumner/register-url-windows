import childProcess from "child_process";
import findUp from "find-up";
import * as fs from "fs";
import * as path from "path";
import tmp from "tmp-promise";

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

async function getNodeModules(cwd: string) {
  return path.resolve(
    await findUp("node_modules", { type: "directory", cwd }),
    "../"
  );
}

export const BINARY_VERSION = process.env.UAC_VERSION;
export const PACKAGE_NAMES = {
  win64: "register-url-win64-bin",
  "win64-uac": "register-url-win64-bin-uac",
};

export async function installBin(requireUAC = true) {
  const packageName = requireUAC
    ? "register-url-win64-bin-uac"
    : "register-url-win64-bin";
  const cwd = await getNodeModules(path.resolve(__dirname));

  return new Promise((resolve, reject) => {
    const child = childProcess.spawn(
      "npm",
      [
        "install",
        `${packageName}@${process.env.UAC_VERSION}`,
        `--legacy-peer-deps`,
        "-g",
        `--production`,
        `--no-fund`,
        `--no-audit`,
        `--no-package-lock`,
        `--ignore-scripts`,
      ],
      {
        cwd,
        detached: false,
        shell: true,
        env: process.env,
      }
    );
    child.stdout.pipe(process.stdout);
    child.stdin.pipe(process.stdin);
    child.once("exit", resolve);
    child.once("error", reject);
  });
}

export async function register(
  request: RegistrationRequest,
  binPath: string = null
): Promise<RegistrationResponse> {
  let downloadBin = binPath;

  if (!binPath) {
    let uac = (request.origins?.length ?? 0) > 0;
    let packageName = uac
      ? "register-url-win64-bin-uac"
      : "register-url-win64-bin";

    try {
      downloadBin = require(path.resolve(
        __dirname,
        "node_modules",
        packageName
      ));
    } catch (exception) {
      return Promise.reject(
        `Please install "${packageName}" into ${path.resolve(
          __dirname
        )} before running this function. For convienience, you can call installBin()`
      );
    }
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

  const filePath = path.resolve(request.output);
  delete request.output;

  await fs.promises.writeFile(filePath, JSON.stringify(request), "utf-8");

  return await new Promise<RegistrationResponse>(async (resolve, reject) => {
    const child = childProcess.spawn(downloadBin, [filePath], {
      env: process.env,
      windowsHide: true,
      detached: false,
      shell: true,
      stdio: "inherit",
    });

    // child.stdout.pipe(process.stdout);
    // child.stdin.pipe(process.stdin);

    child.once("exit", async () => {
      let response: RegistrationResponse;

      try {
        response = JSON.parse(
          (await fs.promises.readFile(filePath, "utf-8")).trim()
        );

        if (typeof response !== "object") {
          throw "Empty response";
        }
      } catch (exception) {
        response = {
          error: exception.message,
          exception,
          chrome: false,
          protocol: false,
          edge: false,
        };
      }

      resolve(response);
    });
  }).catch((err) => {
    return Promise.resolve({
      error: err.message,
      exception: err,
      chrome: false,
      edge: false,
      protocol: false,
    });
  });
}
