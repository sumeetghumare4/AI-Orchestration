#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url).pathname, 'utf-8'));

const program = new Command();

program
  .name('ai-platform')
  .description('AI Training and Prompt Engineering CLI')
  .version(pkg.version);

program
  .command('init')
  .description('Initialize a new project')
  .action(() => {
    console.log('Initializing project...');
  });

program
  .command('train')
  .description('Start training pipeline')
  .option('-m, --model <model>', 'Model name')
  .action((opts) => {
    console.log(`Starting training for model: ${opts.model || 'default'}`);
  });

program.parse();
