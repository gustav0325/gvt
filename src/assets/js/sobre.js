// GVT Cortes e Furos — animação de entrada da seção Sobre (GSAP + ScrollTrigger)
//
// Uma vez, quando a seção entra na tela: a coluna esquerda vem da esquerda, a
// direita vem da direita e a foto desce de cima, as três praticamente juntas,
// devagar. Depois disso a animação acabou: os elementos ficam nas posições do
// layout e acompanham a rolagem normal (não há parallax).
//
// Anima .sobre__entrada--* e .sobre__foto. .sobre__esquerda e .sobre__direita
// não são tocados: o translateX do CSS (o afastamento lateral) é só deles.

(function () {
  "use strict";

  var sobre = document.querySelector(".sobre");
  if (!sobre || !window.gsap || !window.ScrollTrigger) return;

  var gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger);

  var entradaEsquerda = sobre.querySelector(".sobre__entrada--esquerda");
  var entradaDireita = sobre.querySelector(".sobre__entrada--direita");
  var foto = sobre.querySelector(".sobre__foto");
  var animados = [entradaEsquerda, entradaDireita, foto];

  var mm = gsap.matchMedia();

  // --- Desktop -------------------------------------------------------------
  mm.add(
    "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
    function () {
      var DESLOCAMENTO = 100;

      // a coluna direita nasce 100px para fora; sem o recorte horizontal, em
      // 1440+ ela passaria da borda e criaria uma barra de rolagem
      sobre.classList.add("sobre--entrando");

      gsap
        .timeline({
          // power2.out em vez de power3.out: começa um terço mais devagar, então
          // a descida e os deslizes são percebidos, sem a largada de "queda"
          defaults: { duration: 2.3, ease: "power2.out" },
          scrollTrigger: {
            trigger: sobre,
            start: "top 75%",
            once: true,
          },
          onComplete: function () {
            sobre.classList.remove("sobre--entrando");
            // devolve os três ao CSS, sem transform nem opacity inline
            gsap.set(animados, { clearProps: "transform,opacity" });
            animados.forEach(function (el) {
              if (!el.getAttribute("style")) el.removeAttribute("style");
            });
          },
        })
        // os três juntos; a foto, que percorre o eixo vertical, um pouco
        // mais longa para a descida ser percebida até o fim
        .fromTo(foto, { y: -DESLOCAMENTO, opacity: 0 }, { y: 0, opacity: 1, duration: 2.5 }, 0)
        .fromTo(entradaEsquerda, { x: -DESLOCAMENTO, opacity: 0 }, { x: 0, opacity: 1 }, 0.08)
        .fromTo(entradaDireita, { x: DESLOCAMENTO, opacity: 0 }, { x: 0, opacity: 1 }, 0.08);

      // ao trocar de faixa (redimensionar a janela) o matchMedia desfaz tudo;
      // a classe do recorte sai junto
      return function () {
        sobre.classList.remove("sobre--entrando");
      };
    }
  );

  // --- Mobile (até 1023px) --------------------------------------------------
  // A coluna única do frame "Sobre Mobile", como um texto editorial: cada item
  // aparece quando chega à tela, na ordem da leitura —
  //   SOBRE A GVT + Quem somos? → texto → foto → traço + Nossa missão →
  //   texto da missão → CONHEÇA NOSSA HISTÓRIA
  // As colunas do desktop viram display: contents (sem caixa, não animáveis),
  // então quem anima são os próprios itens. Os textos sobem de leve; a foto é
  // descoberta de cima para baixo por um recorte, sem se deslocar. Sem
  // parallax. Ver assets/js/revelar.js.
  mm.add(
    "(max-width: 1023px) and (prefers-reduced-motion: no-preference)",
    function () {
      if (!window.gvtRevelar) return;

      function q(seletor) {
        return sobre.querySelector(seletor);
      }

      var missao = q(".sobre__direita > .sobre__bloco");
      var imagem = foto.querySelector("img");

      function texto(el) {
        return {
          el: el,
          de: { y: 24, opacity: 0 },
          para: { y: 0, opacity: 1, duration: 1.1 },
        };
      }

      window.gvtRevelar([
        texto(q(".sobre__label")),
        texto(q(".sobre__titulo")),
        texto(q(".sobre__esquerda > .sobre__texto")),

        // a foto: a borda de baixo do recorte desce do topo à base; a imagem,
        // presa ao topo, assenta de 1.05 para o tamanho real ao mesmo tempo
        {
          el: foto,
          de: { clipPath: "inset(0% 0% 100% 0%)" },
          para: { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "power2.inOut" },
        },
        {
          el: imagem,
          gatilho: foto,
          de: { scale: 1.05, transformOrigin: "50% 0%" },
          para: { scale: 1, duration: 1.9, ease: "power2.out" },
          limpar: "transform,transformOrigin,scale",
        },

        // o traço amarelo é desenhado e "Nossa missão" sobe junto
        {
          el: q(".sobre__traco"),
          de: { scaleX: 0, transformOrigin: "0% 50%" },
          para: { scaleX: 1, duration: 0.8, ease: "power2.inOut" },
          limpar: "transform,transformOrigin,scale",
        },
        texto(missao.querySelector(".sobre__subtitulo")),
        texto(missao.querySelector(".sobre__texto")),
        texto(q(".sobre__link")),
      ]);
    }
  );
})();
