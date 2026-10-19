import { resolve } from 'node:path';
import { createMentorServer } from './app.mjs';
const port=Number(process.env.PORT || 1430),host=process.env.HOST || '127.0.0.1';
const origin=process.env.APP_ORIGIN || `http://127.0.0.1:${port}`;
const {server}=createMentorServer({filename:process.env.DATABASE_PATH?resolve(process.env.DATABASE_PATH):undefined,origin,host,production:process.env.NODE_ENV==='production',setupToken:process.env.MENTOR_SETUP_TOKEN || ''});
server.listen(port,host,()=>console.log(`Méntor web: ${origin}`));
for (const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>{server.close(()=>process.exit(0));setTimeout(()=>process.exit(1),5000).unref();});
