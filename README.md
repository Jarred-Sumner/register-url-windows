# register-url-windows

This module lets you register a program as a URL protocol in Windows that other applications can open in 1 click (like Google Chrome or Microsoft Edge).

There are type definitions included.

For this to work, your package needs to download `register-url-win64-bin` before running `register`. To make that easier, `installBin()` will do that for you. `register-url-win64-bin` is a separate package because its a 34 MB binary file that your library will probably only need at most once in the lifetime of a package install. There are no native modules to compile (the binary is compiled ahead of time).

It is safe to re-run `register` even if the user is already registered. It will overwrite/append and not result in duplicate or malformed data.

It uses the a small .NET CLI I wrote to edit the registry with the right values. Specifically, it sets:

- `HKEY_CLASSES_ROOT\$name` (URL protocol)

- `HKEY_CURRENT_USER\SOFTWARE\Policies\Google\Chrome\URLAllowlist` (required to recognize the protocol)
- `HKEY_CURRENT_USER\SOFTWARE\Policies\Google\Chrome\ExternalProtocolDialogShowAlwaysOpenCheckbox` (required for `AutoLaunchProtocolsFromOrigins` to work)
- `HKEY_CURRENT_USER\SOFTWARE\Policies\Google\Chrome\AutoLaunchProtocolsFromOrigins`

- `HKEY_CURRENT_USER\SOFTWARE\Policies\Microsoft\Edge\URLAllowlist` (required to recognize the protocol)
- `HKEY_CURRENT_USER\SOFTWARE\Policies\Microsoft\Edge\ExternalProtocolDialogShowAlwaysOpenCheckbox` (required for `AutoLaunchProtocolsFromOrigins` to work)
- `HKEY_CURRENT_USER\SOFTWARE\Policies\Microsoft\Edge\AutoLaunchProtocolsFromOrigins`

```ts
export type RegistrationRequest = {
  /* path to application to run */
  path: string;
  /* name used in registry entry */
  name?: string;
  /* protocol to register. valid protocol: "git-peek". invalid protocol: "git-peek://" */
  protocol: string;
  /* list of domain names to allowlist 1-click open in Chrome/Edge */
  /* Including this will trigger UAC! */
  origins?: string[];
  /* Register the protocol with Windows */
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

export declare function installBin(): Promise<unknown>;

// This will trigger UAC (Administrator) dialog.
export declare function register(
  request: RegistrationRequest
): Promise<RegistrationResponse>;
```
