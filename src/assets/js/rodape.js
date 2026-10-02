// GVT Cortes e Furos — entrada do rodapé (GSAP + ScrollTrigger)
//
// O fechamento da página, mais calmo que as seções acima. Sem pin.
//
//   A. REVELAÇÃO (scrub curto): o palco do rodapé sobe 60px por dentro do
//      próprio rodapé (que faz de máscara, ver footer.css), da hora em que ele
//      aparece até a página chegar ao fim — o conteúdo parece surgir de trás
//      do Contato. Acompanha a rolagem nos dois sentidos.
//
//   B. CONTEÚDO (uma vez, ~1.2s): logo e descrição ↑ → colunas ↑ com stagger
//      → Instagram e WhatsApp ↑ → copyright ↑ → linha amarela desenhada →.
//
// A anima o palco; B anima os filhos dele: nunca o mesmo transform.

(function () {
  "use strict";

  var rodape = document.querySelector(".rodape");
  if (!rodape || !window.gsap || !window.ScrollTrigger) return;

  var gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger);

  function q(seletor) {
    return rodape.querySelector(seletor);
  }

  var palco = q(".rodape__stage");
  var marca = [q(".rodape__logo"), q(".rodape__sobre")];
  var colunas = gsap.utils.toArray(".rodape__coluna", rodape);
  var sociais = gsap.utils.toArray(".rodape__social", rodape);
  var copyright = q(".rodape__copyright");
  var risco = q(".rodape__risco");

  var internos = marca.concat(colunas, sociais, [copyright, risco]);

  // Mobile: a entrada mais discreta da página. Sem a revelação do palco (nada
  // de pin, parallax ou mudança de altura): cada bloco só aparece subindo
  // alguns pixels quando chega à tela, em fila —
  //   logo + descrição → Instagram + WhatsApp → Serviços + Fale conosco →
  //   divisória + copyright (a divisória é a borda do próprio copyright)
  // A coluna Navegação e o traço dourado não aparecem no mobile.
  function entradaMobile() {
    if (!window.gvtRevelar) return;

    var itens = marca.concat(sociais, [q(".rodape__coluna--servicos"), q(".rodape__coluna--contato"), copyright]);

    window.gvtRevelar(
      itens.map(function (el) {
        return {
          el: el,
          de: { y: 14, opacity: 0 },
          para: { y: 0, opacity: 1, duration: 0.9 },
        };
      }),
      { stagger: 0.1, inicio: 0.92 }
    );
  }

  var mm = gsap.matchMedia();

  mm.add(
    {
      desktop: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
      menor: "(max-width: 1023px) and (prefers-reduced-motion: no-preference)",
    },
    function (contexto) {
      if (!contexto.conditions.desktop) {
        entradaMobile();
        return;
      }

      rodape.classList.add("rodape--animado");

      // --- A. revelação estrutural, ligada à rolagem ----------------------
      // termina quando a base do rodapé encosta na base da tela, que é o fim
      // da página: parada ali, o palco está exatamente na posição do layout
      gsap.fromTo(
        palco,
        { y: 60 },
        {
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: rodape,
            start: "top bottom",
            end: "bottom bottom",
            scrub: 0.5,
          },
          // No fim, mesmo translate(0, 0) deixaria o texto fora da grade de
          // pixels (o rodapé começa em y fracionário) e a máscara recortaria
          // a primeira linha: ao chegar em 0, o palco volta a ser o do CSS e a
          // máscara sai. Rolando de volta, os dois voltam com o scrub.
          onUpdate: function () {
            var noFim = this.progress() >= 1;
            rodape.classList.toggle("rodape--animado", !noFim);
            if (noFim) {
              gsap.set(palco, { clearProps: "transform,translate,rotate,scale" });
              if (!palco.getAttribute("style")) palco.removeAttribute("style");
            }
          },
        }
      );

      // --- B. conteúdo, uma vez --------------------------------------------
      gsap.set(marca.concat(colunas, sociais), { y: 25, opacity: 0 });
      gsap.set(copyright, { y: 15, opacity: 0 });
      gsap.set(risco, { scaleX: 0, transformOrigin: "left center" });

      gsap
        .timeline({
          defaults: { ease: "power3.out", duration: 0.7 },
          scrollTrigger: {
            trigger: rodape,
            // com o topo do rodapé a 92% da tela: ele acabou de aparecer
            start: "top 92%",
            once: true,
          },
          onComplete: function () {
            gsap.set(internos, { clearProps: "transform,transformOrigin,opacity" });
            internos.forEach(function (el) {
              if (el && !el.getAttribute("style")) el.removeAttribute("style");
            });
          },
        })
        .to(marca, { y: 0, opacity: 1, stagger: 0.06 }, 0)
        .to(colunas, { y: 0, opacity: 1, stagger: 0.1 }, 0.12)
        .to(sociais, { y: 0, opacity: 1, stagger: 0.08 }, 0.3)
        .to(copyright, { y: 0, opacity: 1, duration: 0.6 }, 0.45)
        .to(risco, { scaleX: 1, duration: 0.6, ease: "power2.inOut" }, 0.6);

      return function () {
        rodape.classList.remove("rodape--animado");
      };
    }
  );
})();
