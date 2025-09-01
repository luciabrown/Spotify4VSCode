import { mkdirSync } from 'fs';
import { spawn } from 'child_process';
import { join } from 'path';

const targets = [
  { GOOS: 'darwin',  GOARCH: 'arm64' },
  { GOOS: 'darwin',  GOARCH: 'amd64' },
  { GOOS: 'linux',   GOARCH: 'arm64' },
  { GOOS: 'linux',   GOARCH: 'amd64' },
  { GOOS: 'windows', GOARCH: 'arm64' },
  { GOOS: 'windows', GOARCH: 'amd64' },
];

const root = join(process.cwd(), '..');          // .../root/frontend -> .. = root
const backendDir = join(root, 'backend');
const outDir = join(process.cwd(), 'out', 'bin'); // .../frontend/out/bin

mkdirSync(outDir, { recursive: true });

function buildOne({ GOOS, GOARCH }) {
  return new Promise((resolve, reject) => {
    const isWin = GOOS === 'windows';
    const outName = `backend-${GOOS}-${GOARCH}${isWin ? '.exe' : ''}`;
    const outPath = join(outDir, outName);

    const env = { ...process.env, GOOS, GOARCH, CGO_ENABLED: '0' }; // cross-compile

    const proc = spawn('go', ['build', '-o', outPath, '.'], {
      cwd: backendDir,
      env,
      stdio: 'inherit'
    });

    proc.on('exit', code => {
      if (code === 0) resolve();
      else reject(new Error(`go build failed for ${GOOS}/${GOARCH}`));
    });
  });
}

for (const t of targets) {
  await buildOne(t);
}

console.log('Built backend binaries into out/bin');
