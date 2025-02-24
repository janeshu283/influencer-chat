import 'dotenv/config';

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\.ts$': 'ts-jest',
  },
  testMatch: ['**/*.test.ts'],
};
