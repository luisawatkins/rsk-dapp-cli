#  Rootstock/create-rsk-dapp

A powerful command-line tool that bootstraps full-stack dApps on Rootstock blockchain in seconds. Say goodbye to configuration headaches and hello to rapid development!

![npm version](https://img.shields.io/npm/v/@rootstock/create-rsk-dapp)
![license](https://img.shields.io/npm/l/@rootstock/create-rsk-dapp)
![downloads](https://img.shields.io/npm/dt/@rootstock/create-rsk-dapp)

## Features

- **Zero Configuration**: Get started with a fully configured Rootstock dApp in seconds
- **Multiple Templates**: Choose between Hardhat + React or Foundry + Vite stacks
- **Pre-configured Networks**: Rootstock Mainnet and Testnet settings out of the box
- **Smart Contract Examples**: Working contracts with tests included
- **Modern Frontend**: Beautiful, responsive UI with Web3 integration
- **Easy Deployment**: Built-in deployment commands for Rootstock networks
- **Secure Defaults**: Environment variables and best practices pre-configured

## Quick Start

### Using npx (recommended - after npm publication)

```bash
npx @rootstock/create-rsk-dapp init my-dapp
cd my-dapp
npm run dev
```

### Global Installation

```bash
npm install -g @rootstock/create-rsk-dapp
create-rsk-dapp init my-dapp
cd my-dapp
npm run dev
```

### Local Development / Testing (before npm publication)

If you're testing locally or before publishing to npm, you can run the CLI directly:

```bash
# Clone the repository
git clone https://github.com/luisawatkins/rsk-dapp-cli
cd rsk-dapp-cli

# Install dependencies
npm install

# Build the project
npm run build

# Run the CLI directly with Node
node dist/index.js init my-dapp

# Or from the parent directory
cd ..
node create-rsk-dapp/dist/index.js init my-dapp

# With options
node create-rsk-dapp/dist/index.js init my-dapp --template hardhat-react --skip-install
```

### Create an alias for easier usage

Add this to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
alias create-rsk-dapp="node /path/to/rsk-quickstart/create-rsk-dapp/dist/index.js"
```

Then you can use:

```bash
create-rsk-dapp init my-dapp
```

## Usage

### Initialize a New Project

```bash
create-rsk-dapp init [project-name] [options]
```

#### Options

- `-t, --template <template>` - Choose template: `hardhat-react` or `foundry-vite`
- `-p, --package-manager <pm>` - Package manager: `npm`, `yarn`, or `pnpm` (default: npm)
- `--skip-install` - Skip dependency installation
- `--skip-git` - Skip git repository initialization

#### Interactive Mode

Simply run without arguments for an interactive setup:

```bash
create-rsk-dapp init
```

You'll be prompted to:
1. Enter your project name
2. Select a template (Hardhat + React or Foundry + Vite)
3. Choose your package manager

### Deploy Contracts

Deploy your smart contracts to Rootstock networks:

```bash
# Deploy to testnet (default)
npm run deploy

# Or use the CLI directly
create-rsk-dapp deploy --network testnet

# Deploy to mainnet (use with caution!)
create-rsk-dapp deploy --network mainnet
```

## Project Structure

### Hardhat + React Template

```
my-dapp/
├── contracts/           # Smart contracts
│   └── RootstockGreeter.sol
├── scripts/            # Deployment scripts
│   └── deploy.js
├── test/              # Contract tests
│   └── RootstockGreeter.test.js
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── App.jsx
│   └── package.json
├── hardhat.config.js  # Hardhat configuration
├── .env.example      # Environment variables template
└── package.json
```

### Foundry + Vite Template

```
my-dapp/
├── contracts/         # Foundry project
│   ├── src/          # Smart contracts
│   ├── test/         # Contract tests
│   ├── script/       # Deployment scripts
│   └── foundry.toml
├── frontend/         # Vite + React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── App.jsx
│   └── package.json
├── .env.example     # Environment variables template
└── package.json
```

## Configuration

### Environment Variables

Create a `.env` file in your project root:

```env
# Private key for deployments (NEVER commit this!)
PRIVATE_KEY=your_private_key_here

# Rootstock RPC URLs
RSK_TESTNET_RPC_URL=https://public-node.testnet.rsk.co
RSK_MAINNET_RPC_URL=https://public-node.rsk.co

# Frontend configuration
VITE_CONTRACT_ADDRESS=0x... # Auto-populated after deployment
VITE_RSK_TESTNET_CHAIN_ID=31
VITE_RSK_MAINNET_CHAIN_ID=30
```

### Network Configuration

#### Rootstock Testnet
- **Chain ID**: 31
- **RPC URL**: https://public-node.testnet.rsk.co
- **Explorer**: https://explorer.testnet.rsk.co
- **Currency**: tRBTC (Test Smart Bitcoin)

#### Rootstock Mainnet
- **Chain ID**: 30
- **RPC URL**: https://public-node.rsk.co
- **Explorer**: https://explorer.rsk.co
- **Currency**: RBTC (Smart Bitcoin)

## Available Scripts

After creating your project, you can run:

### Development

```bash
npm run dev          # Start local development environment
npm run build       # Build for production
npm run test        # Run contract tests
```

### Deployment

```bash
npm run deploy          # Deploy to Rootstock testnet
npm run deploy:mainnet  # Deploy to Rootstock mainnet
```

### Contract Development

```bash
# Hardhat projects
npm run compile     # Compile smart contracts
npx hardhat node   # Start local blockchain

# Foundry projects
forge build        # Compile contracts
forge test         # Run tests
anvil             # Start local blockchain
```

## Templates

### Hardhat + React

Perfect for developers who prefer:
- JavaScript/TypeScript development
- Extensive plugin ecosystem
- Built-in testing framework
- Familiar React development

**Includes:**
- Hardhat development environment
- Ethers.js v6 integration
- React 18 with hooks
- Pre-configured testing setup
- Deployment scripts

### Foundry + Vite

Ideal for developers who want:
- Blazing fast compilation
- Solidity-based testing
- Advanced debugging tools
- Modern frontend tooling

**Includes:**
- Foundry smart contract toolkit
- Vite for instant HMR
- React 18 with TypeScript
- Forge testing framework
- Deployment scripts

## Connecting to Rootstock

### MetaMask Configuration

The dApp automatically prompts to add Rootstock networks to MetaMask. Manual configuration:

1. Open MetaMask
2. Click "Add Network"
3. Enter network details:
   - **Network Name**: Rootstock Testnet
   - **RPC URL**: https://public-node.testnet.rsk.co
   - **Chain ID**: 31
   - **Symbol**: tRBTC
   - **Explorer**: https://explorer.testnet.rsk.co

### Getting Test RBTC

1. Visit the [Rootstock Faucet](https://faucet.rsk.co)
2. Enter your wallet address
3. Complete the captcha
4. Receive test RBTC

## Testing & Development

### Running Commands During Development

When developing or testing the CLI locally, you can use these commands:

```bash
# Build the TypeScript code
npm run build

# Run the CLI with Node.js
node dist/index.js --help

# Initialize a project
node dist/index.js init test-project

# Deploy contracts (from within a created project)
node ../create-rsk-dapp/dist/index.js deploy

# Run with debugging
NODE_ENV=development node dist/index.js init test-project

# Using npx with local path
npx /path/to/create-rsk-dapp init my-app
```

### Quick Test Commands

```bash
# Test Hardhat + React template
node dist/index.js init test-hardhat --template hardhat-react --skip-install

# Test Foundry + Vite template  
node dist/index.js init test-foundry --template foundry-vite --skip-install

# Interactive mode
node dist/index.js init

# With all options
node dist/index.js init my-project \
  --template hardhat-react \
  --package-manager yarn \
  --skip-git
```

## Troubleshooting

### Common Issues

#### "Module not found" errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Contract deployment fails
- Ensure you have RBTC in your wallet
- Check your private key in `.env`
- Verify network connectivity

#### MetaMask doesn't connect
- Ensure you're on the correct network
- Clear MetaMask activity data for the site
- Check that the contract address is set in `.env`

## Contributing

We welcome contributions! Please see our Contributing Guide for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<p align="center">
  Built with ❤️ by the Rootstock community
</p>
