// GVT Cortes e Furos — animação de entrada da seção Obras (GSAP + ScrollTrigger)
//
// Uma respiração depois de Serviços: sem pin, sem scrub, sem parallax. O
// ScrollTrigger só detecta a chegada à seção; a partir daí uma timeline roda
// sozinha, uma vez, e os elementos ficam parados nas posições do layout.
//
//   mapa → (da esquerda)            ← card (da direita)
//   barra amarela desenhada →       etiqueta ↑  título ↑
//   "do norte ao sul..." ↑          parágrafo ↑
//                                   divisória desenhada →
//                                   capacete ↑ + divisor vertical desenhado ↓
//                                   0 → 250+
//                                   VER OBRAS ↑
//
// Nenhum desses elementos tem transform no CSS, então são animados direto.
// As divisórias do card têm opacity 0.4 no CSS: por isso entram só por escala.

(function () {
  "use strict";

  var obras = document.querySelector(".obras");
  if (!obras || !window.gsap || !window.ScrollTrigger) return;

  var gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger);

  function q(seletor) {
    return obras.querySelector(seletor);
  }

  var mapa = q(".obras__mapa");
  var card = q(".obras__card");
  var legendaRisco = q(".obras__legenda-risco");
  var legendaTexto = q(".obras__legenda-texto");
  var etiqueta = q(".obras__etiqueta");
  var titulo = q(".obras__titulo");
  var descricao = q(".obras__descricao");
  var divisor = q(".obras__divisor");
  var capacete = q(".obras__capacete");
  var divisorVertical = q(".obras__divisor-vertical");
  var contador = q(".obras__contador");
  var numero = q(".obras__contador-numero");
  var botao = q(".obras__botao");

  var animados = [
    mapa, card, legendaRisco, legendaTexto, etiqueta, titulo, descricao,
    divisor, capacete, divisorVertical, contador, botao,
  ];

  // o valor final vem do próprio HTML ("250+"), que é o que fica sem JS
  var textoFinal = numero.textContent.trim();
  var alvo = parseInt(textoFinal, 10) || 0;

  var mm = gsap.matchMedia();

  mm.add(
    "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
    function () {
      var contagem = { valor: 0 };

      // Estado inicial aplicado explicitamente (e não por .from()): assim os
      // elementos já estão ocultos antes do gatilho, sem depender de como o
      // GSAP trata o immediateRender em timelines com ScrollTrigger.
      var DESENHO_X = { scaleX: 0, transformOrigin: "left center" };
      gsap.set(mapa, { x: -70, opacity: 0 });
      gsap.set(card, { x: 80, opacity: 0 });
      gsap.set([etiqueta, titulo, descricao, capacete, contador], { y: 15, opacity: 0 });
      gsap.set(legendaTexto, { y: 30, opacity: 0 });
      gsap.set(botao, { y: 12, opacity: 0 });
      gsap.set([legendaRisco, divisor], DESENHO_X);
      gsap.set(divisorVertical, { scaleY: 0, transformOrigin: "center top" });
      // a contagem começa do zero; o texto original volta no fim (ou no revert)
      numero.textContent = "0";

      var tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: obras,
          // com o topo da seção a 65% da tela: um terço dela já à vista,
          // mapa e card entrando no campo de visão
          start: "top 65%",
          once: true,
        },
        onComplete: function () {
          numero.textContent = textoFinal;
          // devolve tudo ao CSS, sem transform nem opacity inline
          gsap.set(animados, { clearProps: "transform,transformOrigin,opacity" });
          animados.forEach(function (el) {
            if (!el.getAttribute("style")) el.removeAttribute("style");
          });
        },
      });

      tl
        // mapa e card juntos, de lados opostos
        .to(mapa, { x: 0, opacity: 1, duration: 1.6 }, 0)
        .to(card, { x: 0, opacity: 1, duration: 1.6 }, 0.08)

        // conteúdo do card se acomodando, enquanto ele ainda desacelera
        .to([etiqueta, titulo], { y: 0, opacity: 1, duration: 0.9, stagger: 0.1 }, 0.4)

        // barra amarela desenhada e, logo depois, o texto sob o mapa
        .to(legendaRisco, { scaleX: 1, duration: 0.6, ease: "power2.out" }, 0.7)
        .to(descricao, { y: 0, opacity: 1, duration: 0.9 }, 0.7)
        .to(legendaTexto, { y: 0, opacity: 1, duration: 1 }, 0.9)

        // divisória do card desenhada da esquerda para a direita
        .to(divisor, { scaleX: 1, duration: 0.8, ease: "power2.inOut" }, 0.95)

        // capacete; o divisor vertical ao lado é desenhado de cima para baixo
        .to(capacete, { y: 0, opacity: 1, duration: 0.8 }, 1.2)
        .to(divisorVertical, { scaleY: 1, duration: 0.7, ease: "power2.out" }, 1.25)

        // 250+: o bloco entra e o número conta de 0 até o valor final
        .to(contador, { y: 0, opacity: 1, duration: 0.8 }, 1.3)
        .fromTo(
          contagem,
          { valor: 0 },
          {
            valor: alvo,
            duration: 1.2,
            ease: "power2.out",
            immediateRender: false,
            onUpdate: function () {
              numero.textContent = String(Math.round(contagem.valor));
            },
            onComplete: function () {
              numero.textContent = textoFinal;
            },
          },
          1.3
        )

        // CTA por último
        .to(botao, { y: 0, opacity: 1, duration: 0.8 }, 1.5);

      // ao trocar de faixa (redimensionar) o matchMedia desfaz os tweens; o
      // número volta ao texto original
      return function () {
        numero.textContent = textoFinal;
      };
    }
  );

  // Mobile e tablet: depois da intensidade de Serviços, uma entrada calma. A
  // seção é uma coluna mais alta que a tela, então cada item aparece quando
  // chega a ela (ver assets/js/revelar.js), na ordem:
  //   ATUAÇÃO NACIONAL, título, texto → capacete, 250+ (um pouco mais
  //   marcado, sem contagem), legenda → VER OBRAS → mapa → "do norte ao sul"
  // O card é display: contents no mobile (sem caixa), por isso não entra. O
  // mapa sobe e aparece como um bloco só, sem escala: os marcadores que ele
  // vai receber, posicionados dentro de .obras__mapa, acompanham essa entrada.
  mm.add(
    "(max-width: 1023px) and (prefers-reduced-motion: no-preference)",
    function () {
      if (!window.gvtRevelar) return;

      function sobe(el, distancia, duracao) {
        return {
          el: el,
          de: { y: distancia, opacity: 0 },
          para: { y: 0, opacity: 1, duration: duracao },
        };
      }

      window.gvtRevelar([
        sobe(etiqueta, 24, 1.1),
        sobe(titulo, 24, 1.1),
        sobe(descricao, 24, 1.1),

        sobe(capacete, 20, 1.1),
        {
          el: divisorVertical,
          de: { scaleY: 0, transformOrigin: "50% 0%" },
          para: { scaleY: 1, duration: 0.8, ease: "power2.inOut" },
          limpar: "transform,transformOrigin,scale",
        },
        {
          el: numero,
          de: { y: 34, opacity: 0 },
          para: { y: 0, opacity: 1, duration: 1.4, ease: "power3.out" },
        },
        sobe(q(".obras__contador-texto"), 16, 1.1),

        sobe(botao, 20, 1.1),

        {
          el: mapa,
          de: { y: 40, opacity: 0 },
          para: { y: 0, opacity: 1, duration: 1.8, ease: "power2.out" },
        },
        sobe(legendaTexto, 16, 1.2),
      ], { stagger: 0.14 });
    }
  );
})();
