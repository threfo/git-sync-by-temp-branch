import globals from 'globals'
import pluginJs from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import prettierRecommended from 'eslint-plugin-prettier/recommended'

export default [
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  eslintConfigPrettier,
  prettierRecommended,
  {
    rules: {
      semi: ['error', 'never'],
      'no-undef': 'error',

      'prettier/prettier': [
        'error',
        {
          semi: false,
          singleQuote: true,
        },
      ],
    },
  },
]
