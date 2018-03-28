import * as Path from 'path';
import * as Fs from 'fs';
import { TypeInfo } from './UltraCreation/Core/TypeInfo';

declare global
{
    let IsDevelopmentMode: boolean;
    let RootPath: string;
    let Config: string;

    module NodeJS
    {
        interface Global
        {
            IsDevelopmentMode: boolean;
            RootPath: string;
            Config: string;
        }
    }
}

global.IsDevelopmentMode = (process.env.NODE_ENV !== 'production');
console.log('NodeJS development mode: ' + global.IsDevelopmentMode);

// const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
const XMLHttpRequest = require('xhr2');
console.log('XMLHttpRequest simulator:', TypeInfo.Assigned(XMLHttpRequest));
(global as any).XMLHttpRequest = XMLHttpRequest;

const FileAPI = require('file-api');
(global as any).File = FileAPI.File;
(global as any).FileList = FileAPI.FileList;
(global as any).FileReader = FileAPI.FileReader;

global.RootPath = Path.dirname(process.argv[1]);
console.log('global.RootPath:', global.RootPath);

global.Config = JSON.parse(Fs.readFileSync(RootPath + '/assets/config.json', {encoding: 'utf8'}));
console.log('Config Loaded.');

