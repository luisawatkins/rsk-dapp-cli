import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

export async function copyTemplate(templatePath: string, targetPath: string): Promise<void> {
  await fs.copy(templatePath, targetPath, {
    filter: (src) => {
      // Skip node_modules and other unwanted files
      const basename = path.basename(src);
      return !basename.includes('node_modules') && 
             !basename.includes('.git') &&
             !basename.includes('dist') &&
             !basename.includes('.DS_Store');
    }
  });
}

export async function updatePackageJson(
  projectPath: string, 
  projectName: string,
  additionalDeps?: Record<string, string>
): Promise<void> {
  const packageJsonPath = path.join(projectPath, 'package.json');
  
  if (await fs.pathExists(packageJsonPath)) {
    const packageJson = await fs.readJson(packageJsonPath);
    
    // Update package name and version
    packageJson.name = projectName;
    packageJson.version = '0.1.0';
    packageJson.private = true;
    
    // Add additional dependencies if provided
    if (additionalDeps) {
      packageJson.dependencies = {
        ...packageJson.dependencies,
        ...additionalDeps
      };
    }
    
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  }
}

export async function createEnvFile(projectPath: string, template: string): Promise<void> {
  const envContent = `# Rootstock Configuration
# DO NOT COMMIT THIS FILE TO VERSION CONTROL

# Private Keys (NEVER share these!)
PRIVATE_KEY=your_private_key_here

# Rootstock Testnet RPC URLs
VITE_RSK_TESTNET_RPC_URL=https://public-node.testnet.rsk.co
RSK_TESTNET_RPC_URL=https://public-node.testnet.rsk.co

# Rootstock Mainnet RPC URLs (use with caution!)
VITE_RSK_MAINNET_RPC_URL=https://public-node.rsk.co
RSK_MAINNET_RPC_URL=https://public-node.rsk.co

# Explorer URLs
VITE_RSK_TESTNET_EXPLORER=https://explorer.testnet.rsk.co
VITE_RSK_MAINNET_EXPLORER=https://explorer.rsk.co

# Chain IDs
VITE_RSK_TESTNET_CHAIN_ID=31
VITE_RSK_MAINNET_CHAIN_ID=30

# Contract Addresses (will be populated after deployment)
VITE_CONTRACT_ADDRESS=
`;

  const envPath = path.join(projectPath, '.env');
  await fs.writeFile(envPath, envContent);
  
  // Also create .env.example
  const envExampleContent = envContent.replace(/=.*/g, '=');
  await fs.writeFile(path.join(projectPath, '.env.example'), envExampleContent);
}

export async function createGitignore(projectPath: string): Promise<void> {
  const gitignoreContent = `# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
*.lcov

# Production
build/
dist/
out/

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Hardhat files
cache/
artifacts/
typechain/
typechain-types/

# Foundry files
cache_forge/
out_forge/

# Deployment files
deployments/
.openzeppelin/

# Misc
*.log
.cache
`;

  await fs.writeFile(path.join(projectPath, '.gitignore'), gitignoreContent);
}
