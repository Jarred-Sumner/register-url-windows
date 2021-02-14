using System;
using System.Collections.Generic;

namespace RegisterURLHandler
{
    public class HandlerArguments
    {
        public string path { get; set; }
        public string? name { get; set; }
        public string? output { get; set; }
        public string? protocol { get; set; }
        public IList<string>? origins { get; set; }
        public bool register { get; set; }
        public HandlerArguments()
        {

        }
    }
}
