export default {
  input: "./module/pazindor-gm-tools.mjs",
  external: (id) => id.startsWith("/modules/"),
  makeAbsoluteExternalsRelative: false,
  output: {
    file: "./release/module/pazindor-gm-tools.mjs",
    format: "es",
  },
};