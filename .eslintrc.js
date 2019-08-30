module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    "plugin:vue/recommended",
    'airbnb-base'
  ],
  rules: {
    "vue/max-attributes-per-line": ["error", {
      "singleline": 6,
      "multiline": {
        "max": 1,
        "allowFirstLine": false
      }
    }],
    "vue/singleline-html-element-content-newline": ["error", {
      "ignoreWhenNoAttributes": true,
      "ignoreWhenEmpty": true,
      "ignores": ["div", "pre", "button", "textarea", "a", "span"]
    }],
    "vue/component-name-in-template-casing": ["error", "PascalCase"],
    "vue/require-default-prop": "off",
    "vue/no-v-html": "off",
    "linebreak-style": ["error", "windows"],
    "no-multi-assign": "off",
    "no-underscore-dangle": "warn",
    eqeqeq: "warn",
    "no-param-reassign": "warn",
    camelcase: "warn",
    "class-methods-use-this": "off",
    "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    "max-len": "off",
    "object-curly-newline": "off"
  },
  parserOptions: {
    parser: "babel-eslint",
    sourceType: "module",
  },
};
