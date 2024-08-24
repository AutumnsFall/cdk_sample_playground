import esbuild from 'esbuild';
import time from 'esbuild-plugin-time';

const options = JSON.parse(process.argv.slice(2, 3));

await esbuild
    .build({
        ...options,
        external:['mysql', 'mysql2', 'better-sqlite3', 'tedious', 'oracledb', 'pg', 'pg-query-stream', 'sqlite3', 'build.mjs'],
        bundle:true,
        sourcemap:true, 
        plugins: [time()],
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

