import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import { copyTemplate, updatePackageJson, createEnvFile, createGitignore } from '../utils/fileSystem';

export interface CreateProjectOptions {
  name: string;
  template: string;
  projectPath: string;
  packageManager: 'npm' | 'yarn' | 'pnpm';
  skipInstall?: boolean;
  skipGit?: boolean;
}

export async function createProject(options: CreateProjectOptions): Promise<void> {
  const { name, template, projectPath, packageManager, skipInstall, skipGit } = options;
  
  // Check if directory already exists
  if (await fs.pathExists(projectPath)) {
    throw new Error(`Directory ${name} already exists. Please choose a different name.`);
  }

  const spinner = ora();
  
  try {
    // Create project directory
    spinner.start('Creating project directory...');
    await fs.ensureDir(projectPath);
    spinner.succeed('Project directory created');

    // Copy template files
    spinner.start(`Setting up ${template} template...`);
    const templatePath = path.join(__dirname, '..', '..', 'templates', template);
    
    if (!await fs.pathExists(templatePath)) {
      // If template doesn't exist yet, create a basic structure
      await createTemplateStructure(projectPath, template);
    } else {
      await copyTemplate(templatePath, projectPath);
    }
    spinner.succeed('Template files copied');

    // Update package.json
    spinner.start('Configuring package.json...');
    await updatePackageJson(projectPath, name);
    spinner.succeed('Package.json configured');

    // Create environment files
    spinner.start('Creating environment configuration...');
    await createEnvFile(projectPath, template);
    spinner.succeed('Environment files created');

    // Create .gitignore
    spinner.start('Setting up Git configuration...');
    await createGitignore(projectPath);
    spinner.succeed('Git configuration created');

    // Initialize git repository
    if (!skipGit) {
      spinner.start('Initializing Git repository...');
      try {
        execSync('git init', { cwd: projectPath, stdio: 'ignore' });
        execSync('git add -A', { cwd: projectPath, stdio: 'ignore' });
        execSync('git commit -m "Initial commit from create-rsk-dapp"', { 
          cwd: projectPath, 
          stdio: 'ignore' 
        });
        spinner.succeed('Git repository initialized');
      } catch (error) {
        spinner.warn('Git repository initialization skipped');
      }
    }

    // Install dependencies
    if (!skipInstall) {
      spinner.start(`Installing dependencies with ${packageManager}...`);
      const installCommand = packageManager === 'yarn' ? 'yarn' : 
                           packageManager === 'pnpm' ? 'pnpm install' : 
                           'npm install';
      
      try {
        execSync(installCommand, { 
          cwd: projectPath, 
          stdio: 'ignore'
        });
        spinner.succeed('Dependencies installed');
      } catch (error) {
        spinner.warn('Failed to install dependencies. Please run install manually.');
      }
    }

  } catch (error) {
    spinner.fail('Project creation failed');
    // Clean up on failure
    await fs.remove(projectPath);
    throw error;
  }
}

async function createTemplateStructure(projectPath: string, template: string): Promise<void> {
  if (template === 'hardhat-react') {
    await createHardhatReactTemplate(projectPath);
  } else if (template === 'foundry-vite') {
    await createFoundryViteTemplate(projectPath);
  }
}

async function createHardhatReactTemplate(projectPath: string): Promise<void> {
  // Create directory structure
  const dirs = [
    'contracts',
    'scripts',
    'test',
    'frontend/src/components',
    'frontend/src/hooks',
    'frontend/src/utils',
    'frontend/src/contracts',
    'frontend/public'
  ];
  
  for (const dir of dirs) {
    await fs.ensureDir(path.join(projectPath, dir));
  }

  // Create package.json for the root project
  const rootPackageJson = {
    name: 'rsk-dapp',
    version: '0.1.0',
    private: true,
    scripts: {
      'dev': 'concurrently "npm run dev:hardhat" "npm run dev:frontend"',
      'dev:hardhat': 'hardhat node',
      'dev:frontend': 'cd frontend && npm run dev',
      'build': 'npm run compile && cd frontend && npm run build',
      'compile': 'hardhat compile',
      'test': 'hardhat test',
      'deploy': 'hardhat run scripts/deploy.js --network rsktestnet',
      'deploy:mainnet': 'hardhat run scripts/deploy.js --network rskmainnet'
    },
    devDependencies: {
      '@nomicfoundation/hardhat-toolbox': '^4.0.0',
      '@nomicfoundation/hardhat-ethers': '^3.0.5',
      '@nomicfoundation/hardhat-verify': '^2.0.3',
      'hardhat': '^2.19.4',
      'ethers': '^6.10.0',
      'dotenv': '^16.3.1',
      'concurrently': '^8.2.2'
    }
  };

  await fs.writeJson(path.join(projectPath, 'package.json'), rootPackageJson, { spaces: 2 });

  // Create Hardhat config
  const hardhatConfig = `require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    rsktestnet: {
      url: process.env.RSK_TESTNET_RPC_URL || "https://public-node.testnet.rsk.co",
      chainId: 31,
      gasPrice: 60000000,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    },
    rskmainnet: {
      url: process.env.RSK_MAINNET_RPC_URL || "https://public-node.rsk.co",
      chainId: 30,
      gasPrice: 60000000,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};`;

  await fs.writeFile(path.join(projectPath, 'hardhat.config.js'), hardhatConfig);

  // Create sample contract
  const sampleContract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract RootstockGreeter {
    string private greeting;
    address public owner;
    
    event GreetingChanged(string newGreeting, address indexed changer);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    constructor(string memory _greeting) {
        greeting = _greeting;
        owner = msg.sender;
    }
    
    function greet() public view returns (string memory) {
        return greeting;
    }
    
    function setGreeting(string memory _greeting) public {
        greeting = _greeting;
        emit GreetingChanged(_greeting, msg.sender);
    }
    
    function setRestrictedGreeting(string memory _greeting) public onlyOwner {
        greeting = _greeting;
        emit GreetingChanged(_greeting, msg.sender);
    }
}`;

  await fs.writeFile(path.join(projectPath, 'contracts/RootstockGreeter.sol'), sampleContract);

  // Create deployment script
  const deployScript = `const hre = require("hardhat");

async function main() {
  console.log("Deploying to Rootstock network...");
  
  const RootstockGreeter = await hre.ethers.getContractFactory("RootstockGreeter");
  const greeter = await RootstockGreeter.deploy("Hello from Rootstock!");
  
  await greeter.waitForDeployment();
  
  const address = await greeter.getAddress();
  console.log("RootstockGreeter deployed to:", address);
  
  // Save the contract address for the frontend
  const fs = require("fs");
  const contractsDir = __dirname + "/../frontend/src/contracts";
  
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }
  
  fs.writeFileSync(
    contractsDir + "/contract-address.json",
    JSON.stringify({ RootstockGreeter: address }, null, 2)
  );
  
  const RootstockGreeterArtifact = artifacts.readArtifactSync("RootstockGreeter");
  
  fs.writeFileSync(
    contractsDir + "/RootstockGreeter.json",
    JSON.stringify(RootstockGreeterArtifact, null, 2)
  );
  
  console.log("Contract artifacts saved to frontend/src/contracts/");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});`;

  await fs.writeFile(path.join(projectPath, 'scripts/deploy.js'), deployScript);

  // Create test file
  const testFile = `const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RootstockGreeter", function () {
  let greeter;
  let owner;
  let addr1;
  
  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const RootstockGreeter = await ethers.getContractFactory("RootstockGreeter");
    greeter = await RootstockGreeter.deploy("Hello, Rootstock!");
    await greeter.waitForDeployment();
  });
  
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await greeter.owner()).to.equal(owner.address);
    });
    
    it("Should return the initial greeting", async function () {
      expect(await greeter.greet()).to.equal("Hello, Rootstock!");
    });
  });
  
  describe("Greetings", function () {
    it("Should update greeting", async function () {
      await greeter.setGreeting("New greeting");
      expect(await greeter.greet()).to.equal("New greeting");
    });
    
    it("Should emit event when greeting changes", async function () {
      await expect(greeter.setGreeting("Event test"))
        .to.emit(greeter, "GreetingChanged")
        .withArgs("Event test", owner.address);
    });
    
    it("Only owner can set restricted greeting", async function () {
      await expect(
        greeter.connect(addr1).setRestrictedGreeting("Unauthorized")
      ).to.be.revertedWith("Only owner can perform this action");
    });
  });
});`;

  await fs.writeFile(path.join(projectPath, 'test/RootstockGreeter.test.js'), testFile);

  // Create frontend package.json
  const frontendPackageJson = {
    name: 'rsk-dapp-frontend',
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview'
    },
    dependencies: {
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
      'ethers': '^6.10.0',
      '@tanstack/react-query': '^5.17.9',
      'wagmi': '^2.5.7',
      'viem': '^2.7.6',
      '@rainbow-me/rainbowkit': '^2.0.0'
    },
    devDependencies: {
      '@types/react': '^18.2.48',
      '@types/react-dom': '^18.2.18',
      '@vitejs/plugin-react': '^4.2.1',
      'vite': '^5.0.11',
      'autoprefixer': '^10.4.16',
      'postcss': '^8.4.33',
      'tailwindcss': '^3.4.1'
    }
  };

  await fs.writeJson(path.join(projectPath, 'frontend/package.json'), frontendPackageJson, { spaces: 2 });

  // Create vite config
  const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {}
  },
  server: {
    port: 3000,
    open: true
  }
});`;

  await fs.writeFile(path.join(projectPath, 'frontend/vite.config.js'), viteConfig);

  // Create index.html
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/rsk-logo.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Rootstock dApp</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;

  await fs.writeFile(path.join(projectPath, 'frontend/index.html'), indexHtml);

  // Create main.jsx
  const mainJsx = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;

  await fs.writeFile(path.join(projectPath, 'frontend/src/main.jsx'), mainJsx);

  // Create App.jsx
  const appJsx = `import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';

function App() {
  const [greeting, setGreeting] = useState('');
  const [newGreeting, setNewGreeting] = useState('');
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    connectWallet();
  }, []);

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        setAccount(accounts[0]);
        
        // Add Rootstock Testnet to MetaMask if not present
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x1f' }], // 31 in hex
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x1f',
                chainName: 'Rootstock Testnet',
                nativeCurrency: {
                  name: 'Test Smart Bitcoin',
                  symbol: 'tRBTC',
                  decimals: 18
                },
                rpcUrls: ['https://public-node.testnet.rsk.co'],
                blockExplorerUrls: ['https://explorer.testnet.rsk.co']
              }]
            });
          }
        }
        
        await loadContract();
      } else {
        alert('Please install MetaMask to use this dApp!');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const loadContract = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Import contract ABI and address
      const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
      if (!contractAddress) {
        console.log('Contract not deployed yet. Run npm run deploy first.');
        return;
      }
      
      const contractABI = (await import('./contracts/RootstockGreeter.json')).abi;
      
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      setContract(contract);
      
      const currentGreeting = await contract.greet();
      setGreeting(currentGreeting);
    } catch (error) {
      console.error('Error loading contract:', error);
    }
  };

  const updateGreeting = async () => {
    if (!contract) return;
    
    try {
      setLoading(true);
      const tx = await contract.setGreeting(newGreeting);
      await tx.wait();
      
      const updatedGreeting = await contract.greet();
      setGreeting(updatedGreeting);
      setNewGreeting('');
      alert('Greeting updated successfully!');
    } catch (error) {
      console.error('Error updating greeting:', error);
      alert('Error updating greeting. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 Rootstock dApp</h1>
        
        {account ? (
          <p>Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
        ) : (
          <button onClick={connectWallet}>Connect Wallet</button>
        )}
        
        {contract && (
          <div className="contract-section">
            <h2>Current Greeting</h2>
            <p className="greeting">{greeting}</p>
            
            <div className="update-section">
              <input
                type="text"
                value={newGreeting}
                onChange={(e) => setNewGreeting(e.target.value)}
                placeholder="Enter new greeting"
              />
              <button 
                onClick={updateGreeting} 
                disabled={loading || !newGreeting}
              >
                {loading ? 'Updating...' : 'Update Greeting'}
              </button>
            </div>
          </div>
        )}
        
        {!contract && account && (
          <p>No contract deployed. Run 'npm run deploy' to deploy the contract.</p>
        )}
      </header>
    </div>
  );
}

export default App;`;

  await fs.writeFile(path.join(projectPath, 'frontend/src/App.jsx'), appJsx);

  // Create CSS files
  const appCss = `.App {
  text-align: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.App-header {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
}

h1 {
  font-size: 3rem;
  margin-bottom: 2rem;
}

button {
  background-color: #4CAF50;
  border: none;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #45a049;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.contract-section {
  margin-top: 2rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.greeting {
  font-size: 1.5rem;
  margin: 1rem 0;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
}

.update-section {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  justify-content: center;
}

input {
  padding: 12px 20px;
  font-size: 16px;
  border: 2px solid #ddd;
  border-radius: 8px;
  width: 300px;
}`;

  await fs.writeFile(path.join(projectPath, 'frontend/src/App.css'), appCss);

  const indexCss = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}`;

  await fs.writeFile(path.join(projectPath, 'frontend/src/index.css'), indexCss);
}

async function createFoundryViteTemplate(projectPath: string): Promise<void> {
  // Create directory structure
  const dirs = [
    'contracts/src',
    'contracts/test',
    'contracts/script',
    'frontend/src/components',
    'frontend/src/hooks',
    'frontend/src/utils',
    'frontend/src/contracts',
    'frontend/public'
  ];
  
  for (const dir of dirs) {
    await fs.ensureDir(path.join(projectPath, dir));
  }

  // Create root package.json
  const rootPackageJson = {
    name: 'rsk-dapp',
    version: '0.1.0',
    private: true,
    scripts: {
      'dev': 'concurrently "npm run dev:anvil" "npm run dev:frontend"',
      'dev:anvil': 'anvil --fork-url https://public-node.testnet.rsk.co',
      'dev:frontend': 'cd frontend && npm run dev',
      'build': 'npm run build:contracts && cd frontend && npm run build',
      'build:contracts': 'cd contracts && forge build',
      'test': 'cd contracts && forge test',
      'deploy': 'cd contracts && forge script script/Deploy.s.sol --rpc-url $RSK_TESTNET_RPC_URL --broadcast',
      'deploy:mainnet': 'cd contracts && forge script script/Deploy.s.sol --rpc-url $RSK_MAINNET_RPC_URL --broadcast'
    },
    devDependencies: {
      'concurrently': '^8.2.2'
    }
  };

  await fs.writeJson(path.join(projectPath, 'package.json'), rootPackageJson, { spaces: 2 });

  // Create foundry.toml
  const foundryToml = `[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.19"
optimizer = true
optimizer_runs = 200

[rpc_endpoints]
rsktestnet = "\${RSK_TESTNET_RPC_URL}"
rskmainnet = "\${RSK_MAINNET_RPC_URL}"

[etherscan]
rsktestnet = { key = "\${ETHERSCAN_API_KEY}" }
rskmainnet = { key = "\${ETHERSCAN_API_KEY}" }`;

  await fs.writeFile(path.join(projectPath, 'contracts/foundry.toml'), foundryToml);

  // Create sample contract
  const sampleContract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract RootstockGreeter {
    string private greeting;
    address public owner;
    
    event GreetingChanged(string newGreeting, address indexed changer);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    constructor(string memory _greeting) {
        greeting = _greeting;
        owner = msg.sender;
    }
    
    function greet() public view returns (string memory) {
        return greeting;
    }
    
    function setGreeting(string memory _greeting) public {
        greeting = _greeting;
        emit GreetingChanged(_greeting, msg.sender);
    }
    
    function setRestrictedGreeting(string memory _greeting) public onlyOwner {
        greeting = _greeting;
        emit GreetingChanged(_greeting, msg.sender);
    }
}`;

  await fs.writeFile(path.join(projectPath, 'contracts/src/RootstockGreeter.sol'), sampleContract);

  // Create deployment script
  const deployScript = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/RootstockGreeter.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        RootstockGreeter greeter = new RootstockGreeter("Hello from Rootstock!");
        
        console.log("RootstockGreeter deployed at:", address(greeter));
        
        vm.stopBroadcast();
    }
}`;

  await fs.writeFile(path.join(projectPath, 'contracts/script/Deploy.s.sol'), deployScript);

  // Create test file
  const testFile = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/RootstockGreeter.sol";

contract RootstockGreeterTest is Test {
    RootstockGreeter public greeter;
    address public owner = address(this);
    address public user = address(0x1);
    
    function setUp() public {
        greeter = new RootstockGreeter("Hello, Rootstock!");
    }
    
    function testInitialGreeting() public {
        assertEq(greeter.greet(), "Hello, Rootstock!");
    }
    
    function testSetGreeting() public {
        greeter.setGreeting("New greeting");
        assertEq(greeter.greet(), "New greeting");
    }
    
    function testGreetingEvent() public {
        vm.expectEmit(true, true, false, true);
        emit RootstockGreeter.GreetingChanged("Event test", address(this));
        greeter.setGreeting("Event test");
    }
    
    function testOnlyOwnerCanSetRestrictedGreeting() public {
        vm.prank(user);
        vm.expectRevert("Only owner can perform this action");
        greeter.setRestrictedGreeting("Unauthorized");
    }
}`;

  await fs.writeFile(path.join(projectPath, 'contracts/test/RootstockGreeter.t.sol'), testFile);

  // Create frontend package.json (similar to Hardhat template)
  const frontendPackageJson = {
    name: 'rsk-dapp-frontend',
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview'
    },
    dependencies: {
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
      'ethers': '^6.10.0',
      '@tanstack/react-query': '^5.17.9',
      'wagmi': '^2.5.7',
      'viem': '^2.7.6',
      '@rainbow-me/rainbowkit': '^2.0.0'
    },
    devDependencies: {
      '@types/react': '^18.2.48',
      '@types/react-dom': '^18.2.18',
      '@vitejs/plugin-react': '^4.2.1',
      'vite': '^5.0.11',
      'autoprefixer': '^10.4.16',
      'postcss': '^8.4.33',
      'tailwindcss': '^3.4.1'
    }
  };

  await fs.writeJson(path.join(projectPath, 'frontend/package.json'), frontendPackageJson, { spaces: 2 });

  // Create the same frontend files as in Hardhat template
  const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {}
  },
  server: {
    port: 3000,
    open: true
  }
});`;

  await fs.writeFile(path.join(projectPath, 'frontend/vite.config.js'), viteConfig);

  // Copy the same frontend files from Hardhat template
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/rsk-logo.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Rootstock dApp</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;

  await fs.writeFile(path.join(projectPath, 'frontend/index.html'), indexHtml);

  // Use the same React app files
  const mainJsx = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;

  await fs.writeFile(path.join(projectPath, 'frontend/src/main.jsx'), mainJsx);

  // App.jsx with Foundry adjustments
  const appJsx = `import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';

function App() {
  const [greeting, setGreeting] = useState('');
  const [newGreeting, setNewGreeting] = useState('');
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    connectWallet();
  }, []);

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        setAccount(accounts[0]);
        
        // Add Rootstock Testnet to MetaMask if not present
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x1f' }], // 31 in hex
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x1f',
                chainName: 'Rootstock Testnet',
                nativeCurrency: {
                  name: 'Test Smart Bitcoin',
                  symbol: 'tRBTC',
                  decimals: 18
                },
                rpcUrls: ['https://public-node.testnet.rsk.co'],
                blockExplorerUrls: ['https://explorer.testnet.rsk.co']
              }]
            });
          }
        }
        
        await loadContract();
      } else {
        alert('Please install MetaMask to use this dApp!');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const loadContract = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Import contract ABI and address
      const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
      if (!contractAddress) {
        console.log('Contract not deployed yet. Run forge deploy first.');
        return;
      }
      
      // For Foundry, we'll need to import the ABI from the out directory
      const contractABI = (await import('./contracts/RootstockGreeter.json')).abi;
      
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      setContract(contract);
      
      const currentGreeting = await contract.greet();
      setGreeting(currentGreeting);
    } catch (error) {
      console.error('Error loading contract:', error);
    }
  };

  const updateGreeting = async () => {
    if (!contract) return;
    
    try {
      setLoading(true);
      const tx = await contract.setGreeting(newGreeting);
      await tx.wait();
      
      const updatedGreeting = await contract.greet();
      setGreeting(updatedGreeting);
      setNewGreeting('');
      alert('Greeting updated successfully!');
    } catch (error) {
      console.error('Error updating greeting:', error);
      alert('Error updating greeting. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 Rootstock dApp (Foundry + Vite)</h1>
        
        {account ? (
          <p>Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
        ) : (
          <button onClick={connectWallet}>Connect Wallet</button>
        )}
        
        {contract && (
          <div className="contract-section">
            <h2>Current Greeting</h2>
            <p className="greeting">{greeting}</p>
            
            <div className="update-section">
              <input
                type="text"
                value={newGreeting}
                onChange={(e) => setNewGreeting(e.target.value)}
                placeholder="Enter new greeting"
              />
              <button 
                onClick={updateGreeting} 
                disabled={loading || !newGreeting}
              >
                {loading ? 'Updating...' : 'Update Greeting'}
              </button>
            </div>
          </div>
        )}
        
        {!contract && account && (
          <p>No contract deployed. Run 'npm run deploy' to deploy the contract.</p>
        )}
      </header>
    </div>
  );
}

export default App;`;

  await fs.writeFile(path.join(projectPath, 'frontend/src/App.jsx'), appJsx);

  // Copy CSS files
  const appCss = `.App {
  text-align: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.App-header {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
}

h1 {
  font-size: 3rem;
  margin-bottom: 2rem;
}

button {
  background-color: #ff6b6b;
  border: none;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #ff5252;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.contract-section {
  margin-top: 2rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.greeting {
  font-size: 1.5rem;
  margin: 1rem 0;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
}

.update-section {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  justify-content: center;
}

input {
  padding: 12px 20px;
  font-size: 16px;
  border: 2px solid #ddd;
  border-radius: 8px;
  width: 300px;
}`;

  await fs.writeFile(path.join(projectPath, 'frontend/src/App.css'), appCss);

  const indexCss = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}`;

  await fs.writeFile(path.join(projectPath, 'frontend/src/index.css'), indexCss);
}
