import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';

export interface DeployOptions {
  network: string;
  contract?: string;
}

export async function deployContract(options: DeployOptions): Promise<void> {
  const spinner = ora();
  
  try {
    // Check if we're in a project directory
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!await fs.pathExists(packageJsonPath)) {
      throw new Error('No package.json found. Make sure you are in a Rootstock dApp project directory.');
    }
    
    // Check for .env file
    const envPath = path.join(process.cwd(), '.env');
    if (!await fs.pathExists(envPath)) {
      console.log(chalk.yellow('No .env file found. Creating one...'));
      
      const { privateKey } = await inquirer.prompt([
        {
          type: 'password',
          name: 'privateKey',
          message: 'Enter your private key (will be saved in .env):',
          validate: (input) => {
            if (!input) return 'Private key is required';
            if (!/^(0x)?[0-9a-fA-F]{64}$/.test(input)) {
              return 'Invalid private key format';
            }
            return true;
          }
        }
      ]);
      
      const envContent = `PRIVATE_KEY=${privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey}
RSK_TESTNET_RPC_URL=https://public-node.testnet.rsk.co
RSK_MAINNET_RPC_URL=https://public-node.rsk.co`;
      
      await fs.writeFile(envPath, envContent);
      console.log(chalk.green('.env file created'));
    }
    
    // Determine which framework is being used
    const isHardhat = await fs.pathExists(path.join(process.cwd(), 'hardhat.config.js'));
    const isFoundry = await fs.pathExists(path.join(process.cwd(), 'contracts', 'foundry.toml'));
    
    if (!isHardhat && !isFoundry) {
      throw new Error('No Hardhat or Foundry configuration found. Make sure you are in a valid project.');
    }
    
    spinner.start(`Deploying to Rootstock ${options.network}...`);
    
    let deployCommand: string;
    
    if (isHardhat) {
      // Compile first
      execSync('npx hardhat compile', { stdio: 'ignore' });
      
      // Deploy using Hardhat
      deployCommand = `npx hardhat run scripts/deploy.js --network rsk${options.network}`;
    } else {
      // Deploy using Foundry
      const rpcUrl = options.network === 'mainnet' 
        ? 'https://public-node.rsk.co'
        : 'https://public-node.testnet.rsk.co';
      
      deployCommand = `cd contracts && forge script script/Deploy.s.sol --rpc-url ${rpcUrl} --broadcast -vvv`;
    }
    
    // Execute deployment
    const output = execSync(deployCommand, { 
      encoding: 'utf-8',
      env: { ...process.env }
    });
    
    spinner.succeed('Contract deployed successfully!');
    
    // Parse deployment output to get contract address
    const addressMatch = output.match(/deployed (?:to|at):?\s*(0x[a-fA-F0-9]{40})/i);
    if (addressMatch) {
      const contractAddress = addressMatch[1];
      console.log(chalk.green(`\n✅ Contract Address: ${contractAddress}`));
      console.log(chalk.cyan(`\n🔍 View on Explorer:`));
      
      const explorerUrl = options.network === 'mainnet'
        ? `https://explorer.rsk.co/address/${contractAddress}`
        : `https://explorer.testnet.rsk.co/address/${contractAddress}`;
      
      console.log(chalk.cyan(explorerUrl));
      
      // Update .env with contract address
      const envContent = await fs.readFile(envPath, 'utf-8');
      const updatedEnv = envContent.replace(
        /VITE_CONTRACT_ADDRESS=.*/g,
        `VITE_CONTRACT_ADDRESS=${contractAddress}`
      );
      
      if (!envContent.includes('VITE_CONTRACT_ADDRESS')) {
        await fs.appendFile(envPath, `\nVITE_CONTRACT_ADDRESS=${contractAddress}`);
      } else {
        await fs.writeFile(envPath, updatedEnv);
      }
      
      console.log(chalk.green('\n✅ Contract address saved to .env file'));
    }
    
    console.log(chalk.green(`
🎉 Deployment successful!

Next steps:
1. ${chalk.cyan('npm run dev')} - Start the development server
2. Connect your wallet to Rootstock ${options.network}
3. Interact with your deployed contract
    `));
    
  } catch (error) {
    spinner.fail('Deployment failed');
    throw error;
  }
}
