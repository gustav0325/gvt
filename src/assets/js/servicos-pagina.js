// GVT Cortes e Furos — animações da página Serviços (GSAP + ScrollTrigger + SplitText)
//
// Sem pin e sem scroll horizontal. O layout do CSS é o estado final de tudo:
// no fim de cada entrada os estilos inline saem e os títulos voltam ao HTML.
//
// Cada parte com a sua função:
//   Hero       impacto: a foto é revelada a partir da direita (assentando de
//              1.04 para o tamanho real), o traço, o título linha a linha
//              — SUA OBRA. por último —, o texto e o botão
//   Soluções   apresentação: o título se abre da esquerda e o texto chega
//              da direita, ao encontro dele
//   Serviços   exploração: cada bloco, ao chegar à tela, revela a foto a
//              partir do próprio lado (esquerda → direita ou o inverso) e
//              o conteúdo vem do mesmo lado. O hover do bloco (sobe 3px,
//              foto a 1.03, seta) é só CSS, em servicos-pagina.css
//   Processo   progressão ligada ao scroll: a linha amarela é desenhada
//              01 → 04 e cada etapa se acende quando é alcançada (volta
//              junto se o usuário subir); no 04, o check é "desenhado"
//   Orçamento  conversão: o concreto se abre da direita sobre o amarelo,
//              título, texto e botão
//   Rodapé     eco da abertura, mais discreto
//
// A navbar não é tocada.

(function () {
  "use strict";

  var raiz = document.documentElement;

  function liberarAbertura() {
    raiz.classList.remove("abertura-animada");
  }

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  var SplitText = window.SplitText;

  if (!gsap || !ScrollTrigger || !SplitText || !document.querySelector(".sv-hero")) {
    liberarAbertura();
    return;
  }

  // desarma a trava de segurança do <head>
  window.__gvtAbertura = true;
  gsap.registerPlugin(ScrollTrigger, SplitText);

  function q(seletor, contexto) {
    return (contexto || document).querySelector(seletor);
  }

  function qa(seletor, contexto) {
    return gsap.utils.toArray((contexto || document).querySelectorAll(seletor));
  }

  // devolve os elementos ao CSS (sem o atributo style vazio)
  function limpar(elementos) {
    elementos.forEach(function (el) {
      if (!el) return;
      gsap.set(el, {
        clearProps: "transform,transformOrigin,translate,rotate,scale,opacity,clipPath,visibility",
      });
      if (!el.getAttribute("style")) el.removeAttribute("style");
    });
  }

  // --- Títulos: linhas por trás de máscaras (como na página Sobre) ----------
  var divisoes = [];

  function dividir(titulo) {
    // a versão do título da outra faixa (.sv-versao-desktop/-mobile, oculta)
    // sairia como linhas a mais: sai durante a divisão e volta ao juntar
    var original = titulo.innerHTML;
    qa(".sv-versao-desktop, .sv-versao-mobile", titulo).forEach(function (versao) {
      if (getComputedStyle(versao).display === "none") versao.remove();
    });
    var divisao = SplitText.create(titulo, { type: "lines", mask: "lines", linesClass: "sv-linha" });
    divisao.htmlOriginal = original;
    titulo.classList.add("sv-mascarado");
    gsap.set(divisao.lines, { yPercent: 125 }); // a altura da linha + a folga da máscara
    gsap.set(titulo, { opacity: 1 });
    divisoes.push({ titulo: titulo, divisao: divisao });
    return divisao;
  }

  function juntar(titulo) {
    divisoes = divisoes.filter(function (item) {
      if (item.titulo !== titulo) return true;
      item.divisao.revert();
      titulo.innerHTML = item.divisao.htmlOriginal;
      titulo.classList.remove("sv-mascarado");
      return false;
    });
    limpar([titulo]);
  }

  // anima as linhas a partir de `posicao`; devolve o instante da última
  function linhas(tl, titulo, posicao, opcoes) {
    opcoes = opcoes || {};
    var divisao = dividir(titulo);
    var passo = opcoes.passo != null ? opcoes.passo : 0.1;
    var t = posicao;
    divisao.lines.forEach(function (linha) {
      if (opcoes.destaque && linha.querySelector(opcoes.destaque)) t += opcoes.atrasoDestaque || 0;
      tl.to(linha, { yPercent: 0, duration: opcoes.duracao || 1.1, ease: "power3.out" }, t);
      t += passo;
    });
    return t;
  }

  function traco(tl, el, posicao, duracao) {
    tl.fromTo(
      el,
      { scaleX: 0, opacity: 1, transformOrigin: "0% 50%" },
      { scaleX: 1, duration: duracao || 0.8, ease: "power2.inOut" },
      posicao
    );
  }

  function aoEntrar(gatilho, inicio, montar) {
    if (!gatilho) return;
    ScrollTrigger.create({ trigger: gatilho, start: inicio, once: true, onEnter: montar });
  }

  var mm = gsap.matchMedia();

  mm.add(
    {
      desktop: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
      menor: "(max-width: 1023px) and (prefers-reduced-motion: no-preference)",
      reduzido: "(prefers-reduced-motion: reduce)",
    },
    function (contexto) {
      if (contexto.conditions.reduzido) {
        liberarAbertura();
        return;
      }

      var desktop = contexto.conditions.desktop;
      var k = desktop ? 1 : 0.6; // no mobile, deslocamentos menores

      // ======================================================================
      // 1. Hero — impacto
      // ======================================================================
      var hero = q(".sv-hero");
      var heroFoto = q(".sv-hero__foto", hero);
      var heroRisco = q(".sv-hero__risco", hero);
      var heroTitulo = q(".sv-hero__titulo", hero);
      var heroTexto = q(".sv-hero__texto", hero);
      var heroCta = q(".sv-hero__cta", hero);

      function abrir() {
        if (desktop) gsap.set(heroFoto, { clipPath: "inset(0% 0% 0% 100%)", scale: 1.04, transformOrigin: "100% 50%" });
        gsap.set(heroRisco, { scaleX: 0, opacity: 1, transformOrigin: "0% 50%" });
        gsap.set([heroTexto, heroCta], { y: 16 * k, opacity: 0 });
        liberarAbertura();

        var tl = gsap.timeline({
          onComplete: function () {
            juntar(heroTitulo);
            limpar([heroFoto, heroRisco, heroTexto, heroCta]);
          },
        });

        // a foto se abre da direita; por dentro, assenta devagar (no
        // celular ela já está à vista e o texto começa antes)
        if (desktop) {
          tl.to(heroFoto, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.7, ease: "power3.inOut" }, 0);
          tl.to(heroFoto, { scale: 1, duration: 2.6, ease: "power2.out" }, 0);
        }

        traco(tl, heroRisco, desktop ? 0.35 : 0.1);
        var fim = linhas(tl, heroTitulo, desktop ? 0.5 : 0.2, {
          destaque: ".sv-destaque",
          atrasoDestaque: 0.2,
          duracao: 1.2,
        });
        tl.to(heroTexto, { y: 0, opacity: 1, duration: 1, ease: "power2.out" }, fim + 0.05);
        tl.to(heroCta, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" }, fim + 0.2);
      }

      var espera = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
      var teto = new Promise(function (ok) {
        setTimeout(ok, 1500);
      });
      // e, chegando de outra página, o conteúdo terminar de assentar (transicao.js)
      Promise.all([Promise.race([espera, teto]), window.gvtEntradaPronta]).then(function () {
        try {
          if (raiz.classList.contains("abertura-animada")) abrir();
        } catch (erro) {
          liberarAbertura();
        }
      });

      // ======================================================================
      // 2. Soluções completas — apresentação
      // ======================================================================
      var solucoes = q(".sv-solucoes");
      var solRisco = q(".sv-solucoes__risco", solucoes);
      var solTitulo = q(".sv-solucoes__titulo", solucoes);
      var solTexto = q(".sv-solucoes__texto", solucoes);

      // o título se abre da esquerda (o recorte passa um pouco acima e abaixo
      // da caixa, para não cortar acentos) e o texto vem da direita
      gsap.set(solRisco, { scaleX: 0, transformOrigin: "0% 50%" });
      gsap.set(solTitulo, { x: -30 * k, clipPath: "inset(-20% 100% -20% 0%)" });
      gsap.set(solTexto, { x: 30 * k, opacity: 0 });

      aoEntrar(solucoes, desktop ? "top 72%" : "top 80%", function () {
        var tl = gsap.timeline({
          onComplete: function () {
            limpar([solRisco, solTitulo, solTexto]);
          },
        });
        traco(tl, solRisco, 0);
        tl.to(solTitulo, { x: 0, clipPath: "inset(-20% 0% -20% 0%)", duration: 1.3, ease: "power3.out" }, 0.15);
        tl.to(solTexto, { x: 0, opacity: 1, duration: 1.2, ease: "power3.out" }, 0.3);
      });

      // ======================================================================
      // 3. Serviços — exploração
      // ======================================================================
      var servicos = qa(".sv-servico");

      servicos.forEach(function (bloco) {
        var foto = q(".sv-servico__foto", bloco);
        var partes = [q(".sv-servico__titulo", bloco), q(".sv-servico__texto", bloco), q(".sv-servico__link", bloco)];
        var esquerda = bloco.classList.contains("sv-servico--foto-esquerda");
        // a foto se abre a partir do seu lado; o conteúdo chega do mesmo lado.
        // No celular (foto em cima, texto embaixo): a foto se abre de cima
        // para baixo e o texto sobe alguns pixels
        var fechada = !desktop ? "inset(0% 0% 100% 0%)" : esquerda ? "inset(0% 100% 0% 0%)" : "inset(0% 0% 0% 100%)";
        var lado = esquerda ? -1 : 1;

        gsap.set(bloco, { opacity: 0 });
        gsap.set(foto, {
          clipPath: fechada,
          scale: desktop ? 1.08 : 1.05,
          transformOrigin: !desktop ? "50% 0%" : esquerda ? "0% 50%" : "100% 50%",
        });
        if (desktop) gsap.set(partes, { x: 16 * k * lado, opacity: 0 });
        else gsap.set(partes, { y: 12, opacity: 0 });

        aoEntrar(bloco, desktop ? "top 82%" : "top 85%", function () {
          var tl = gsap.timeline({
            onComplete: function () {
              limpar([bloco, foto].concat(partes));
            },
          });
          tl.to(bloco, { opacity: 1, duration: desktop ? 0.6 : 0.4, ease: "power1.out" }, 0);
          tl.to(foto, { clipPath: "inset(0% 0% 0% 0%)", duration: desktop ? 1.2 : 0.8, ease: "power3.inOut" }, 0.1);
          tl.to(foto, { scale: 1, duration: desktop ? 1.6 : 1.1, ease: "power2.out" }, 0.1);
          tl.to(partes, { x: 0, y: 0, opacity: 1, duration: desktop ? 0.9 : 0.7, ease: "power3.out", stagger: desktop ? 0.1 : 0.07 }, desktop ? 0.6 : 0.35);
        });
      });

      // ======================================================================
      // 4. Processo — progressão ligada ao scroll
      // ======================================================================
      var processo = q(".sv-processo");
      var procTitulo = q(".sv-processo__titulo", processo);
      var procTexto = q(".sv-processo__texto", processo);
      var lista = q(".sv-etapas", processo);
      var etapas = qa(".sv-etapa", processo);
      var icones = etapas.map(function (etapa) {
        return q(".sv-etapa__icone", etapa);
      });
      var check = q(".sv-etapa--entrega .sv-etapa__icone img", processo);

      gsap.set(procTitulo, { opacity: 0 });
      gsap.set(procTexto, { y: 14 * k, opacity: 0 });

      aoEntrar(processo, desktop ? "top 75%" : "top 80%", function () {
        var tl = gsap.timeline({
          onComplete: function () {
            juntar(procTitulo);
            limpar([procTexto]);
          },
        });
        var fim = linhas(tl, procTitulo, 0);
        tl.to(procTexto, { y: 0, opacity: 1, duration: 1, ease: "power2.out" }, fim - 0.1);
      });

      // Estado inicial: etapas apagadas (legíveis) e traços por desenhar. O
      // traço i liga a etapa i-1 à i, e é o ::before da etapa i (--traco).
      gsap.set(etapas, { "--ativa": 0, "--traco": 0, "--linha": 0 });

      var progresso = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: lista,
          // desktop: de quando a linha de etapas passa de 80% da tela até
          // chegar a 32% (metade da tela de rolagem, sem prender nada);
          // mobile: acompanha as etapas empilhadas, de cima para baixo
          start: desktop ? "top 80%" : "top 78%",
          end: desktop ? "top 32%" : "bottom 62%",
          scrub: 0.6,
        },
      });

      // pulso discreto no ícone quando a etapa é alcançada (só descendo)
      function alcancar(i) {
        var st = progresso.scrollTrigger;
        if (st && st.direction < 0) return;
        gsap.fromTo(
          icones[i],
          { scale: 1 },
          {
            scale: 1.12,
            duration: 0.22,
            ease: "power1.out",
            yoyo: true,
            repeat: 1,
            overwrite: "auto",
            onComplete: function () {
              limpar([icones[i]]);
            },
          }
        );
        // 04: o check é desenhado da esquerda para a direita — concluído
        if (i === etapas.length - 1 && check) {
          gsap.fromTo(
            check,
            { clipPath: "inset(0% 100% 0% 0%)" },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 0.7,
              ease: "power2.out",
              overwrite: "auto",
              onComplete: function () {
                limpar([check]);
              },
            }
          );
        }
      }

      progresso.to(etapas[0], { "--ativa": 1, duration: 0.5 }, 0);
      progresso.call(alcancar, [0], 0.2);
      for (var i = 1; i < etapas.length; i++) {
        // desktop: o traço que chega na etapa (::before dela); celular: a
        // linha vertical que desce da anterior (::after dela)
        if (desktop) progresso.to(etapas[i], { "--traco": 1, duration: 1 }, ">");
        else progresso.to(etapas[i - 1], { "--linha": 1, duration: 1 }, ">");
        progresso.to(etapas[i], { "--ativa": 1, duration: 0.5 }, ">-0.05");
        progresso.call(alcancar, [i], "<0.15");
      }

      // ======================================================================
      // 5. Orçamento — conversão
      // ======================================================================
      var orcamento = q(".sv-orcamento");
      var textura = q(".sv-orcamento__textura", orcamento);
      var orcTitulo = q(".sv-orcamento__titulo", orcamento);
      var orcTexto = q(".sv-orcamento__texto", orcamento);
      var orcBotao = q(".sv-orcamento__botao", orcamento);

      // o concreto se abre da direita sobre o amarelo do fundo (a mesma cor
      // da textura), deslizando 20px — a textura é mais larga que a seção
      gsap.set(textura, { clipPath: "inset(0% 0% 0% 100%)", x: 20 * k });
      gsap.set(orcTitulo, { opacity: 0 });
      gsap.set(orcTexto, { y: 14 * k, opacity: 0 });
      gsap.set(orcBotao, { y: 12 * k, opacity: 0 });

      aoEntrar(orcamento, desktop ? "top 80%" : "top 85%", function () {
        var tl = gsap.timeline({
          onComplete: function () {
            juntar(orcTitulo);
            limpar([textura, orcTexto, orcBotao]);
          },
        });
        tl.to(textura, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "power3.inOut" }, 0);
        tl.to(textura, { x: 0, duration: 2.2, ease: "power2.out" }, 0);
        var fim = linhas(tl, orcTitulo, 0.3);
        tl.to(orcTexto, { y: 0, opacity: 1, duration: 0.9, ease: "power2.out" }, fim - 0.1);
        tl.to(orcBotao, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, fim + 0.1);
      });

      // ======================================================================
      // 6. Rodapé — eco da abertura, mais discreto
      // ======================================================================
      var rodape = q(".rodape");
      var logo = q(".rodape__logo", rodape);
      var sobreTexto = q(".rodape__sobre", rodape);
      var sociais = q(".rodape__sociais", rodape);
      var colunas = qa(".rodape__coluna", rodape);
      var copyright = q(".rodape__copyright", rodape);
      var rodapeRisco = q(".rodape__risco", rodape);

      // o logo sobe por trás de uma máscara parada (desce 100% e o recorte
      // esconde exatamente o que sai da própria caixa)
      gsap.set(logo, { yPercent: 100, clipPath: "inset(0% 0% 100% 0%)" });
      gsap.set([sobreTexto, sociais].concat(colunas), { y: 12 * k, opacity: 0 });
      gsap.set(copyright, { y: 8 * k, opacity: 0 });
      gsap.set(rodapeRisco, { scaleX: 0, transformOrigin: "0% 50%" });

      aoEntrar(rodape, "top 88%", function () {
        var tl = gsap.timeline({
          defaults: { ease: "power2.out" },
          onComplete: function () {
            limpar([logo, sobreTexto, sociais, copyright, rodapeRisco].concat(colunas));
          },
        });
        tl.to(logo, { yPercent: 0, clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "power3.out" }, 0);
        tl.to(sobreTexto, { y: 0, opacity: 1, duration: 0.9 }, 0.2);
        tl.to(sociais, { y: 0, opacity: 1, duration: 0.9 }, 0.35);
        tl.to(colunas, { y: 0, opacity: 1, duration: 0.9, stagger: 0.1 }, 0.5);
        tl.to(copyright, { y: 0, opacity: 1, duration: 0.8 }, 0.85);
        traco(tl, rodapeRisco, 0.95);
      });

      // trocar de faixa (resize) desfaz estados e gatilhos
      return function () {
        divisoes.slice().forEach(function (item) {
          juntar(item.titulo);
        });
        etapas.forEach(function (etapa) {
          etapa.style.removeProperty("--ativa");
          etapa.style.removeProperty("--traco");
          etapa.style.removeProperty("--linha");
          if (!etapa.getAttribute("style")) etapa.removeAttribute("style");
        });
      };
    }
  );
})();
