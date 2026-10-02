const fs = require("fs");
const crypto = require("crypto");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  // /favicon.ico na raiz: o que ferramentas e navegadores pedem quando não
  // leem o <link rel="icon">; também substitui um ícone antigo no servidor
  eleventyConfig.addPassthroughCopy("src/favicon.ico");
  // GSAP servido do próprio site (o _site vai por FTP, sem depender de CDN)
  eleventyConfig.addPassthroughCopy({
    "node_modules/gsap/dist/gsap.min.js": "assets/js/vendor/gsap.min.js",
    "node_modules/gsap/dist/ScrollTrigger.min.js": "assets/js/vendor/ScrollTrigger.min.js",
    "node_modules/gsap/dist/SplitText.min.js": "assets/js/vendor/SplitText.min.js",
  });

  eleventyConfig.addGlobalData("anoAtual", new Date().getFullYear());

  // "?v=" com o hash do arquivo em src/: muda só quando o arquivo muda, e
  // aí o navegador busca de novo em vez de manter a cópia em cache
  eleventyConfig.addFilter("versao", function (caminho) {
    const conteudo = fs.readFileSync("src" + caminho);
    const hash = crypto.createHash("md5").update(conteudo).digest("hex").slice(0, 8);
    return caminho + "?v=" + hash;
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site",
    },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
