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
export declare function installBin(requireUAC?: boolean): Promise<unknown>;
export declare function register(request: RegistrationRequest): Promise<RegistrationResponse>;
