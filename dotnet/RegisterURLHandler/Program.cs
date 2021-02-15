using System;
using Microsoft.Win32;
using System.IO;
using System.Collections.Generic;
using Newtonsoft.Json;
using System.Runtime.InteropServices;
using System.Text;

namespace RegisterURLHandler
{
    class Program
    {
        [DllImport("shell32.dll", SetLastError=true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        static extern bool IsUserAnAdmin();

        static public string output;

        static void WriteError(string Error) {
            WriteResponse(JsonConvert.SerializeObject(new { error = Error }));
            Console.Error.Write(Error);
        }

        static void WriteResponse(string text)
        {
            File.WriteAllText(output, text, Encoding.UTF8);
        }


        static void Main(string[] args)
        {
            RegisterURLHandler.Program.output = args[0];

            HandlerArguments obj;
            var input = File.ReadAllText(args[0], Encoding.UTF8);
            try
            {
                obj = JsonConvert.DeserializeObject<HandlerArguments>(input);
            } catch(Exception exception)
            {
                WriteError(exception.ToString() + "\n" + "while reading:\n" + input + "\n from:" + args[0]);
                Environment.Exit(1);
                return;
            }
            

            var protocol = obj.protocol;
            var appPath = obj.path;
            var appName = obj.name;
            var allowOrigins = obj.origins != null ? new List<string>(obj.origins) : new List<string>();
            var skipRegister = !obj.register;

            if (protocol == null)
            {
                RegisterURLHandler.Program.WriteError("protocol is required");
                Environment.Exit(1);
            }

            if (!skipRegister && appPath == null)
            {
                RegisterURLHandler.Program.WriteError("path is required");
                Environment.Exit(1);
            }

            if (appName == null)
            {
                appName = protocol;
            }
            protocol = protocol.Replace("://", "");


            Dictionary<string, bool> registrations = new Dictionary<string, bool>();
            registrations.Add("error", false);


            if (skipRegister)
            {
                registrations.Add("protocol", false);
            } else
            {
                registrations.Add("protocol", Register(protocol, appPath, appName));
            }


            if (allowOrigins.Count > 0)
            {
                registrations.Add("chrome", allowListChrome(protocol, allowOrigins.ToArray()));
                registrations.Add("edge", allowListEdge(protocol, allowOrigins.ToArray()));
            } else
            {
                registrations.Add("chrome", false);
                registrations.Add("edge", false);
            }



            var json = JsonConvert.SerializeObject(registrations);
            WriteResponse(json);
            Environment.Exit(0);
        }

        static bool Register(string protocol, string path, string appName)
        {
            if (!File.Exists(path))
            {
                WriteError("path does not exist " + path);
                Environment.Exit(1);
            }


            RegistryKey key = Registry.CurrentUser;
            string[] RegKeys = "Software\\Classes".Split('\'');
            var _regKey = key;
            foreach (string _key in RegKeys)
            {

                _regKey = key.OpenSubKey(_key, RegistryKeyPermissionCheck.ReadWriteSubTree);
                if (_regKey == null)
                {
                    _regKey = key.CreateSubKey(_key, RegistryKeyPermissionCheck.ReadWriteSubTree);
                }
                key = _regKey;
            }

            key = key.OpenSubKey(appName, true);

            if (key == null)  //if the protocol is not registered yet...we register it
            {
                key = _regKey.CreateSubKey(appName, true);
            }

                key.SetValue(string.Empty, "URL: " + protocol + " Protocol");
                key.SetValue("URL Protocol", string.Empty);

                key = key.CreateSubKey(@"shell\open\command");
            //%1 represents the argument - this tells windows to open this program with an argument / parameter
            key.SetValue(string.Empty, path + " " + "%1");

            key.Close();

            return true;
        }

        static bool allowListChrome(string protocol, string[] origins)
        {

            return registerPolicies("SOFTWARE\\Policies\\Google\\Chrome", "URLAllowlist", protocol, origins);
        }
        static void updateLaunchProtocolEntry(RegistryKey key, string[] origins, string protocol)
        {

            key.SetValue("protocol", protocol);

            var allowedOrigins = key.CreateSubKey("allowed_origins", RegistryKeyPermissionCheck.ReadWriteSubTree);
            if (allowedOrigins == null)
            {
                allowedOrigins = key.OpenSubKey("allowed_origins", RegistryKeyPermissionCheck.ReadWriteSubTree);
            }

            var list = allowedOrigins.GetValueNames();
            var listOffset = list.Length;

            var skip = false;
            foreach (string origin in origins)
            {
                foreach (string valueName in list)
                {

                    if (origin.Equals(allowedOrigins.GetValue(valueName, null)))
                    {
                        skip = true;
                        break;
                    }
                }

                if (!skip)
                {
                    allowedOrigins.SetValue(listOffset.ToString(), origin);
                    listOffset++;
                }

            }
            allowedOrigins.Close();

            key.Close();
        }
        static void addToLaunchProtocolList(RegistryKey parentKey, string[] origins, string protocol)
        {
            var list = parentKey.GetSubKeyNames();
            RegistryKey key;
            foreach (string keyName in list) {
                key = parentKey.OpenSubKey(keyName, RegistryKeyPermissionCheck.ReadWriteSubTree);
                string protocolValue = (string)key.GetValue("protocol", null);
                if (protocolValue != null && protocol.Equals(protocolValue))
                {
                    updateLaunchProtocolEntry(key, origins, protocol);
                    parentKey.Close();

                    return;
                }


            }

            key = parentKey.CreateSubKey(list.Length.ToString(), RegistryKeyPermissionCheck.ReadWriteSubTree);
            updateLaunchProtocolEntry(key, origins, protocol);
            parentKey.Close();

        }

        static bool registerPolicies(string subkey, string childKey, string protocol, string[] origins)
        {
            if (!RegisterURLHandler.Program.IsUserAnAdmin())
            {
                WriteError("Administrator is required.");
                Environment.Exit(1);
            }

            RegistryKey regKey = Registry.CurrentUser;
            string[] RegKeys = subkey.Split('\'');
            var _regKey = regKey;
            foreach (string _key in RegKeys)
            {

                _regKey = regKey.OpenSubKey(_key, RegistryKeyPermissionCheck.ReadWriteSubTree);
                if (_regKey == null)
                {
                    _regKey = regKey.CreateSubKey(_key, RegistryKeyPermissionCheck.ReadWriteSubTree);
                }
                regKey = _regKey;
            }

            string value = protocol + "://*";


            var originsKey = regKey.CreateSubKey("AutoLaunchProtocolsFromOrigins", RegistryKeyPermissionCheck.ReadWriteSubTree);
            addToLaunchProtocolList(originsKey, origins, protocol);

            regKey.SetValue("ExternalProtocolDialogShowAlwaysOpenCheckbox", 1);
            regKey = regKey.CreateSubKey(childKey, RegistryKeyPermissionCheck.ReadWriteSubTree);


            var list = regKey.GetValueNames();

            foreach (string name in list)
            {
                if (regKey.GetValue(name, null).Equals(value)) {
                    regKey.Close();
                    _regKey.Close();
                    return true;
                }
            }



            regKey.SetValue(list != null ? list.Length.ToString() : "0", value, RegistryValueKind.String);



            regKey.Close();
            _regKey.Close();

            return true;

        }

        static bool allowListEdge(string protocol, string[] origins)
        {
            return registerPolicies("Software\\Policies\\Microsoft\\Edge", "URLAllowlist", protocol, origins);
        }
    }
}
