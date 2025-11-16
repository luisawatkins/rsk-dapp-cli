#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import path from 'path';
import { createProject } from './commands/create';
import { deployContract } from './commands/deploy';
import { validateProjectName } from './utils/validation';
import { getPackageVersion } from './utils/packageInfo';

const program = new Command();

async function main() {
  const version = await getPackageVersion();
  
  console.log(chalk.cyan(`
╔═══════════════════════════════════════════╗
║                                           ║
║   🚀 Rootstock dApp Creator v${version}        ║
║   Build full-stack dApps on RSK          ║
║                                           ║
╚═══════════════════════════════════════════╝
  `));

  program
    .name('create-rsk-dapp')
    .description('Create a full-stack dApp on Rootstock blockchain')
    .version(version);

  program
    .command('init [project-name]')
    .description('Initialize a new Rootstock dApp project')
    .option('-t, --template <template>', 'Project template (hardhat-react or foundry-vite)')
    .option('-p, --package-manager <pm>', 'Package manager to use (npm, yarn, or pnpm)', 'npm')
    .option('--skip-install', 'Skip dependency installation')
    .option('--skip-git', 'Skip git initialization')
    .action(async (projectName, options) => {
      try {
        let name = projectName;
        let template = options.template;
        let packageManager = options.packageManager;

        // If no project name provided, prompt for it
        if (!name) {
          const { inputName } = await inquirer.prompt([
            {
              type: 'input',
              name: 'inputName',
              message: 'What is your project named?',
              default: 'my-rsk-dapp',
              validate: (input) => {
                const validation = validateProjectName(input);
                return validation.valid || validation.errors.join(', ');
              }
            }
          ]);
          name = inputName;
        }

        // Validate project name
        const validation = validateProjectName(name);
        if (!validation.valid) {
          console.error(chalk.red(`Invalid project name: ${validation.errors.join(', ')}`));
          process.exit(1);
        }

        // If no template provided, prompt for it
        if (!template) {
          const { selectedTemplate } = await inquirer.prompt([
            {
              type: 'list',
              name: 'selectedTemplate',
              message: 'Which project template would you like to use?',
              choices: [
                {
                  name: '⚡ Hardhat + React - Full-featured development environment with React frontend',
                  value: 'hardhat-react'
                },
                {
                  name: '🔥 Foundry + Vite - Fast, modern tooling with Vite frontend',
                  value: 'foundry-vite'
                }
              ]
            }
          ]);
          template = selectedTemplate;
        }

        // Confirm package manager
        if (!['npm', 'yarn', 'pnpm'].includes(packageManager)) {
          const { selectedPm } = await inquirer.prompt([
            {
              type: 'list',
              name: 'selectedPm',
              message: 'Which package manager would you like to use?',
              choices: ['npm', 'yarn', 'pnpm'],
              default: 'npm'
            }
          ]);
          packageManager = selectedPm;
        }

        const projectPath = path.join(process.cwd(), name);

        // Create the project
        await createProject({
          name,
          template,
          projectPath,
          packageManager,
          skipInstall: options.skipInstall,
          skipGit: options.skipGit
        });

        console.log(chalk.green(`
✨ Success! Created ${name} at ${projectPath}

Inside that directory, you can run several commands:

  ${chalk.cyan(`${packageManager} ${packageManager === 'npm' ? 'run ' : ''}dev`)}
    Starts the development server.

  ${chalk.cyan(`${packageManager} ${packageManager === 'npm' ? 'run ' : ''}build`)}
    Builds the app for production.

  ${chalk.cyan(`${packageManager} ${packageManager === 'npm' ? 'run ' : ''}deploy`)}
    Deploys your contracts to Rootstock testnet.

We suggest that you begin by typing:

  ${chalk.cyan(`cd ${name}`)}
  ${chalk.cyan(`${packageManager} ${packageManager === 'npm' ? 'run ' : ''}dev`)}

Happy building on Rootstock! 🚀
        `));

      } catch (error) {
        console.error(chalk.red('Error creating project:'), error);
        process.exit(1);
      }
    });

  program
    .command('deploy')
    .description('Deploy contracts to Rootstock network')
    .option('-n, --network <network>', 'Network to deploy to (testnet or mainnet)', 'testnet')
    .option('-c, --contract <contract>', 'Specific contract to deploy')
    .action(async (options) => {
      try {
        await deployContract(options);
      } catch (error) {
        console.error(chalk.red('Error deploying contracts:'), error);
        process.exit(1);
      }
    });

  program.parse(process.argv);

  // Show help if no command provided
  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
}

main().catch((error) => {
  console.error(chalk.red('Unexpected error:'), error);
  process.exit(1);
});
