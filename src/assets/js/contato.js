// GVT Cortes e Furos — animação de entrada da seção Contato
// (GSAP + ScrollTrigger + SplitText)
//
// O fechamento da página: sem pin, sem scrub, sem parallax. O ScrollTrigger só
// detecta a chegada; a partir daí uma timeline roda sozinha, uma vez:
//
//   foto revelada pela própria diagonal, da direita para a esquerda
//   linha amarela desenhada de cima para baixo
//   título: cada linha sobe por baixo de uma máscara (o ponto vai com ALTURA)
//   parágrafo ↑, WhatsApp ↑, solicitação ↑
//
// Nada é movido que já tenha transform no CSS: a foto e a linha amarela são
// reveladas só por recorte (ver o fim de contato.css), e do bloco de conteúdo
// (translateY(-50%)) animam-se os filhos. A fotografia não se mexe.

(function () {
  "use strict";

  var contato = document.querySelector(".contato");
  if (!contato || !window.gsap || !window.ScrollTrigger || !window.SplitText) return;

  var gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger, window.SplitText);

  var textura = contato.querySelector(".contato__textura");
  var foto = contato.querySelector(".contato__foto");
  var riscoDiagonal = contato.querySelector(".contato__risco-diagonal");
  var risco = contato.querySelector(".contato__risco");
  var titulo = contato.querySelector(".contato__titulo");
  var descricao = contato.querySelector(".contato__descricao");
  var botoes = gsap.utils.toArray(".contato__botao", contato);

  var mm = gsap.matchMedia();

  mm.add(
    {
      desktop: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
      menor: "(max-width: 1023px) and (prefers-reduced-motion: no-preference)",
    },
    function (contexto) {
      // Mobile: não há foto nem diagonal (display: none no CSS). A entrada é
      // só tipográfica, com deslocamentos menores, e a textura grafite do
      // fundo desliza alguns pixels enquanto isso — só para dar profundidade.
      var desktop = contexto.conditions.desktop;
      var k = desktop ? 1 : 0.6;
      var split = null;

      // estado inicial, explícito: tudo já oculto antes do gatilho
      contato.classList.add("contato--animando");
      if (desktop) {
        gsap.set(foto, { "--abertura": 0 });
        gsap.set(riscoDiagonal, { "--traco": 0 });
      } else {
        // a textura tem 125% da largura, presa à esquerda: vinda da esquerda
        // ela nunca descobre a borda
        gsap.set(textura, { x: -14, opacity: 0.3 });
      }
      gsap.set(risco, { scaleX: 0, transformOrigin: "left center" });
      // o título só é dividido em linhas no gatilho; até lá fica invisível
      gsap.set(titulo, { opacity: 0 });
      gsap.set(descricao, { y: 25 * k, opacity: 0 });
      gsap.set(botoes, { y: 20 * k, opacity: 0 });

      function desfazerTitulo() {
        if (split) {
          split.revert();
          split = null;
        }
        titulo.classList.remove("contato__titulo--mascarado");
      }

      function terminar() {
        desfazerTitulo();
        contato.classList.remove("contato--animando");
        foto.style.removeProperty("--abertura");
        riscoDiagonal.style.removeProperty("--traco");
        gsap.set([risco, titulo, descricao].concat(botoes), {
          clearProps: "transform,transformOrigin,opacity",
        });
        if (!desktop) gsap.set(textura, { clearProps: "transform,translate,opacity" });
        [textura, foto, riscoDiagonal, risco, titulo, descricao].concat(botoes).forEach(function (el) {
          if (!el.getAttribute("style")) el.removeAttribute("style");
        });
      }

      function entrar() {
        // As linhas são as reais deste momento (a divisão acontece aqui, não
        // no carregamento, então um redimensionamento antes não as quebra).
        // Cada linha fica dentro de uma máscara e parte de baixo dela.
        split = window.SplitText.create(titulo, {
          type: "lines",
          mask: "lines",
          linesClass: "contato__titulo-linha",
        });
        titulo.classList.add("contato__titulo--mascarado");
        // 125%: além da própria altura, cobre a folga que a máscara ganhou
        // para não cortar acentos (ver contato.css)
        gsap.set(split.lines, { yPercent: 125 });
        gsap.set(titulo, { opacity: 1 });

        if (!desktop) {
          gsap
            .timeline({ onComplete: terminar })
            // o fundo quase não se move: 14px e um pouco de opacidade, devagar
            .to(textura, { x: 0, opacity: 0.5, duration: 3.2, ease: "power1.out" }, 0)
            .to(risco, { scaleX: 1, duration: 0.7, ease: "power2.inOut" }, 0)
            .to(split.lines, { yPercent: 0, duration: 1.2, ease: "power3.out", stagger: 0.12 }, 0.25)
            .to(descricao, { y: 0, opacity: 1, duration: 1.1, ease: "power2.out" }, 0.85)
            .to(botoes, { y: 0, opacity: 1, duration: 1, ease: "power2.out", stagger: 0.14 }, 1.1);
          return;
        }

        gsap
          .timeline({ onComplete: terminar })
          // a diagonal desliza da borda direita até o ângulo do layout
          .to(foto, { "--abertura": 1, duration: 1.8, ease: "power2.inOut" }, 0)
          // a linha amarela é desenhada enquanto a foto ainda se abre
          .to(riscoDiagonal, { "--traco": 1, duration: 1.1, ease: "power2.inOut" }, 0.4)
          // o pequeno traço dourado acima do título, antes dele
          .to(risco, { scaleX: 1, duration: 0.6, ease: "power2.out" }, 0.55)
          // título: linha a linha, por baixo das máscaras
          .to(split.lines, { yPercent: 0, duration: 1.3, ease: "power3.out", stagger: 0.12 }, 0.6)
          .to(descricao, { y: 0, opacity: 1, duration: 1.1, ease: "power3.out" }, 1.2)
          .to(botoes, { y: 0, opacity: 1, duration: 1, ease: "power3.out", stagger: 0.12 }, 1.4);
      }

      window.ScrollTrigger.create({
        trigger: contato,
        // desktop: com o topo da seção a 40% da tela — a foto já ocupa boa
        // parte dela e o título, no meio da seção, entra enquanto está
        // visível. No mobile não há foto e o título está no alto da seção:
        // ele entra assim que chega à tela.
        start: desktop ? "top 40%" : "top 70%",
        once: true,
        onEnter: entrar,
      });

      // ao trocar de faixa (redimensionar) o matchMedia desfaz os tweens
      return function () {
        desfazerTitulo();
        contato.classList.remove("contato--animando");
      };
    }
  );
})();
