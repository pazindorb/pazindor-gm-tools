export default {
  input: "./module/pazindor-gm-tools.mjs",

  plugins: [
    {
      name: "rewrite-foundry-import",
      resolveId(source) {
        if (source === "/modules/pazindor-dev-essentials/module/dialog/base-dialog.mjs") {
          return { id: "/modules/pazindor-dev-essentials/module/pazindor-dev-essentials.mjs", external: true, };
        }
        return null;
      },
    },
  ],

  output: {
    file: "./release/module/pazindor-gm-tools.mjs",
    format: "es",
  },
};