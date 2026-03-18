#!/usr/bin/env node
const { spawn } = require('child_process');

console.log('🎈 Starting PartyKit...');

const partykit = spawn('npx', ['partykit', 'dev'], {
  shell: true,
  stdio: ['inherit', 'pipe', 'pipe'],
});

let tunnelStarted = false;

function tryStartTunnel(text) {
  if (tunnelStarted) return;
  const match = text.match(/Ready on http:\/\/0\.0\.0\.0:(\d+)/);
  if (!match) return;
  const port = match[1];
  tunnelStarted = true;

  console.log(`\n✅ PartyKit running on port ${port}`);
  console.log('🌐 Starting Cloudflare tunnel...\n');

  const cf = spawn('npx', ['cloudflared', 'tunnel', '--url', `http://127.0.0.1:${port}`], {
    shell: true,
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  cf.stdout.on('data', d => {
    const text = d.toString();
    process.stdout.write(text);
    const urlMatch = text.match(/https:\/\/[a-z0-9\-]+\.trycloudflare\.com/);
    if (urlMatch) {
      console.log('\n╔══════════════════════════════════════════════════╗');
      console.log('║  🔗 LINK DO GRY:                                  ║');
      console.log(`║  ${urlMatch[0].padEnd(49)}║`);
      console.log('╚══════════════════════════════════════════════════╝\n');
      console.log('📋 Wyślij ten link znajomemu — gra zacznie się automatycznie!\n');
    }
  });

  cf.stderr.on('data', d => {
    const text = d.toString();
    const urlMatch = text.match(/https:\/\/[a-z0-9\-]+\.trycloudflare\.com/);
    if (urlMatch) {
      console.log('\n╔══════════════════════════════════════════════════╗');
      console.log('║  🔗 LINK DO GRY:                                  ║');
      console.log(`║  ${urlMatch[0].padEnd(49)}║`);
      console.log('╚══════════════════════════════════════════════════╝\n');
      console.log('📋 Wyślij ten link znajomemu — gra zacznie się automatycznie!\n');
    }
  });

  cf.on('exit', code => {
    console.log(`Cloudflare tunnel exited (${code})`);
    process.exit(0);
  });
}

partykit.stdout.on('data', d => {
  const text = d.toString();
  process.stdout.write(text);
  tryStartTunnel(text);
});

partykit.stderr.on('data', d => {
  const text = d.toString();
  process.stderr.write(text);
  tryStartTunnel(text);
});

partykit.on('exit', code => {
  console.log(`PartyKit exited (${code})`);
  process.exit(0);
});

process.on('SIGINT', () => process.exit(0));
