import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1.ts',
  },
  transform: {
    '^.+\\.(ts|js)x?$': ['ts-jest', { isolatedModules: true }],
  },
  roots: ['<rootDir>'],
  testMatch: [
    '**/src/**/__tests__/**?(*.)+(spec|test).[tj]s?(x)',
    '**/src/**?(*.)+(spec|test).[tj]s?(x)',
  ],
};

export default config;
