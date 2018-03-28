import * as http from 'http';
import { IncomingMessage, ServerResponse } from 'http';
import { InitializeStorage } from './UltraCreation/Storage/index';
import { TMySqlPool } from './UltraCreation/Storage/Engine/nodejs.mysql';

const DB = InitializeStorage(new TMySqlPool({
    database: 'www',
    user: 'ultracreation_db_user',
    password: 'Dasboot12!@12',
    connectionLimit: 100,
}));

DB.GetConnection().then(conn =>
{
    DB.StrictInsert = true;
    DB.StrictUpdate = true;
    DB.StrictDelete = true;

    DB.DebugTracing = IsDevelopmentMode;
    DB.ReleaseConnection(conn);
    console.log('MySqlPool Engine is Ok...');
});

const httpServer: http.Server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
    res.writeHead(200);
    res.end('Hello Typescript!');
});

httpServer.listen(8200, () => console.log('listening'));
