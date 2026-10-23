module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/packages/$1',
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
