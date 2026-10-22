/** @type {import('prettier').Config} */
export default {
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 100,
  tabWidth: 2,
  overrides: [
    {
      // release-please re-serialises these with JSON.stringify; match it to avoid format churn.
      files: [".claude-plugin/*.json", ".release-please-manifest.json"],
      options: { parser: "json-stringify" },
    },
  ],
};
