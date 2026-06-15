module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
  // Allow individual test files to declare their own environment via
  // /** @jest-environment jsdom */ docblock at the top of the file.
  testEnvironmentOptions: {
    customExportConditions: [""],
  },
};

