module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: ['prettier', 'plugin:vue/recommended', 'airbnb-base'],
  plugins: ['prettier'],
  rules: {
    // 'prettier/prettier': ['error'],
    'vue/max-attributes-per-line': [
      'error',
      {
        singleline: 6,
        multiline: {
          max: 1,
          allowFirstLine: false,
        },
      },
    ],
    'vue/singleline-html-element-content-newline': [
      'error',
      {
        ignoreWhenNoAttributes: true,
        ignoreWhenEmpty: true,
        ignores: ['div', 'pre', 'button', 'textarea', 'a', 'span'],
      },
    ],
    'vue/multiline-html-element-content-newline': [
      'error',
      {
        ignoreWhenEmpty: true,
        ignores: ['div', 'pre', 'li'],
        allowEmptyLines: false,
      },
    ],
    'vue/html-self-closing': [
      'error',
      {
        html: {
          void: 'always',
          normal: 'never',
          component: 'any',
        },
      },
    ],
    'vue/component-name-in-template-casing': ['error', 'PascalCase'],
    'vue/require-default-prop': 'off',
    'vue/no-v-html': 'off',
    'linebreak-style': ['error', 'windows'],
    'no-multi-assign': 'off',
    'no-underscore-dangle': 'warn',
    eqeqeq: 'warn',
    'no-param-reassign': 'warn',
    camelcase: 'warn',
    'class-methods-use-this': 'off',
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'max-len': 'off',
    'object-curly-newline': 'off',
  },
  parserOptions: {
    parser: 'babel-eslint',
    sourceType: 'module',
  },
};
