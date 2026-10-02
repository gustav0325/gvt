// GVT Cortes e Furos — entrada por elemento, usada no mobile (GSAP + ScrollTrigger)
//
// No mobile as seções viram colunas mais altas que a tela: uma timeline única
// por seção rodaria com metade dela fora de vista. Aqui cada item é revelado
// quando ele próprio chega à tela (uma vez só) e fica parado na posição do CSS.
//
// Itens que chegam juntos (uma rolagem mais rápida, dois elementos na mesma
// altura) entram em fila, com um stagger curto, na ordem em que foram passados
// — que é a ordem visual (Sobre e Obras reordenam o DOM com `order` no
// mobile). Itens que já saíram por cima da tela quando o gatilho dispara
// (rolagem muito rápida, navegação por âncora) aparecem direto, sem fila.
//
//   window.gvtRevelar([
//     { el, de: { y: 24, opacity: 0 }, para: { y: 0, opacity: 1, duration: 1 } },
//     { el, gatilho: outroEl, atraso: 0.1, de: {...}, para: {...}, limpar: "clipPath" },
//   ], { stagger: 0.12, inicio: 0.88 });
//
// inicio: o item entra quando o topo dele passa por essa fração da tela (0.88
// = a 88% do alto). A posição é a do layout, sem o deslocamento inicial — o
// ScrollTrigger mediria o elemento já empurrado para baixo — e nunca fica
// além do fim da rolagem: o que está no pé da página (o copyright) entra
// mesmo que o topo dele não chegue a subir tanto.
//
// Chamado dentro de um gsap.matchMedia(): os estados iniciais e os gatilhos
// entram no contexto e são desfeitos ao trocar de faixa.

(function () {
  "use strict";

  if (!window.gsap || !window.ScrollTrigger) return;

  var gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger);

  var TRANSFORMS = ["x", "y", "xPercent", "yPercent", "scale", "scaleX", "scaleY", "rotate"];

  // o que o clearProps precisa tirar para o elemento voltar a ser só o do CSS
  function propriedades(de) {
    var lista = [];
    Object.keys(de).forEach(function (chave) {
      if (TRANSFORMS.indexOf(chave) !== -1) {
        if (lista.indexOf("transform") === -1) lista.push("transform", "translate", "rotate", "scale");
      } else {
        lista.push(chave);
      }
    });
    return lista.join(",");
  }

  window.gvtRevelar = function (itens, opcoes) {
    opcoes = opcoes || {};
    var passo = opcoes.stagger != null ? opcoes.stagger : 0.12;
    var inicio = opcoes.inicio != null ? opcoes.inicio : 0.88;
    var livre = 0; // instante (relógio do GSAP) em que a fila fica livre

    function vez() {
      var agora = gsap.ticker.time;
      var t = Math.max(agora, livre);
      livre = t + passo;
      return t - agora;
    }

    itens.forEach(function (item) {
      var el = item.el;
      if (!el) return;

      var limpar = item.limpar || propriedades(item.de);

      function terminar() {
        gsap.set(el, { clearProps: limpar });
        if (!el.getAttribute("style")) el.removeAttribute("style");
      }

      var gatilho = item.gatilho || el;
      // só o deslocamento vertical do próprio gatilho altera o topo medido
      var empurrao = gatilho === el ? item.de.y || 0 : 0;

      gsap.set(el, item.de);

      window.ScrollTrigger.create({
        trigger: gatilho,
        start: function () {
          var topo = gatilho.getBoundingClientRect().top + window.scrollY - empurrao;
          var px = topo - inicio * window.innerHeight;
          return Math.max(0, Math.min(px, window.ScrollTrigger.maxScroll(window) - 1));
        },
        once: true,
        onEnter: function () {
          if (el.getBoundingClientRect().bottom < 0) {
            terminar();
            return;
          }
          var vars = Object.assign({ ease: "power2.out" }, item.para);
          vars.delay = vez() + (item.atraso || 0);
          vars.onComplete = terminar;
          gsap.to(el, vars);
        },
      });
    });
  };
})();
