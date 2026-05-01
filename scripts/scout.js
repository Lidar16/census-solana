import { Connection } from '@solana/web3.js';
import { Octokit } from 'octokit';
import fs from 'fs';

const GITHUB_TOKEN = "             N";
const GIST_ID = "         ";
const RPC_ENDPOINTS = [
    { name: "Solana Mainnet", url: "https://api.mainnet-beta.solana.com" },
    { name: "Solana Devnet", url: "https://api.devnet.solana.com" }
];
const LOG_FILE = 'scout_history.json';

const octokit = new Octokit({ auth: GITHUB_TOKEN });

async function uploadToGist(content) {
    try {
        await octokit.request(`PATCH /gists/${GIST_ID}`, {
            gist_id: GIST_ID,
            files: {
                'scout_live_data.json': { content: JSON.stringify(content, null, 2) }
            }
        });
        console.log(`[CLOUD]  Live data synchronized to GitHub Gist.`);
    } catch (error) {
        console.log(`[ERROR]  Gist synchronization failed.`);
    }
}

async function runScout() {
    console.log(`\n[SYSTEM] [${new Date().toLocaleTimeString()}] Initializing global network probe...`);
    let currentResults = [];
    
    for (const node of RPC_ENDPOINTS) {
        const connection = new Connection(node.url, 'confirmed');
        const start = Date.now();
        
        try {
            const version = await connection.getVersion();
            const slot = await connection.getSlot();
            const latency = Date.now() - start;

            const entry = {
                name: node.name,
                latency: latency,
                slot: slot,
                version: version['solana-core'],
                timestamp: new Date().toISOString()
            };

            console.log(`[OK]    [${node.name}] Slot: ${slot} | Latency: ${latency}ms`);
            currentResults.push(entry);

        } catch (error) {
            console.log(`[ERROR] [${node.name}] Connection timeout.`);
        }
    }

    // Save locally
    let history = fs.existsSync(LOG_FILE) ? JSON.parse(fs.readFileSync(LOG_FILE)) : [];
    history = [...history, ...currentResults].slice(-1440);
    fs.writeFileSync(LOG_FILE, JSON.stringify(history, null, 2));

    // Upload to GitHub
    await uploadToGist(history);
    
    console.log(`[IDLE]   Awaiting next interval (60s)...`);
}

runScout();
setInterval(runScout, 60000);
