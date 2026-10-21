// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
  },
  prettier,
  {
    ignores: ["dist/", "node_modules/"],
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
);
