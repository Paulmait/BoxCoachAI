module.exports = {
  extends: ['expo', 'prettier'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrors: 'none', // Allow unused catch clause variables
      },
    ],
    // Disable exhaustive-deps warnings for stable callbacks
    'react-hooks/exhaustive-deps': 'warn',
  },
};
