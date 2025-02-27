import globals from "globals";
import pluginJs from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      globals: globals.browser,
    },
  },
  pluginJs.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      globals: globals.browser,
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...prettierConfig.rules, // Disables conflicting rules
      "prettier/prettier": "error", // Enforces Prettier formatting
      "semi": ["error", "never"],
    },
  },
];