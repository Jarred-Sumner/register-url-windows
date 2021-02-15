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
export declare type RegistrationRequest = {
  path: string;
  name?: string;
  protocol: string;
  origins?: string[];
  register: boolean;
  output?: string;
};
export declare type RegistrationResponse = {
  error: false | string;
  chrome: boolean;
  edge: boolean;
  protocol: boolean;
  exception?: Error;
};
export declare const BINARY_VERSION: string;
export declare const PACKAGE_NAMES: {
  win64: string;
  "win64-uac": string;
};
export declare function installBin(requireUAC?: boolean): Promise<unknown>;
export declare function register(
  request: RegistrationRequest,
  binPath?: string
): Promise<RegistrationResponse>;
```
