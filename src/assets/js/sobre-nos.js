// GVT Cortes e Furos — animações da página Sobre Nós (GSAP + ScrollTrigger + SplitText)
//
// Sem pin e sem scroll horizontal: o ScrollTrigger só detecta a chegada de
// cada parte, e uma timeline curta roda uma vez. O layout do CSS é o estado
// final de tudo — no fim de cada timeline os estilos inline saem e os
// títulos voltam ao HTML original.
//
// Uma linguagem, com funções diferentes:
//   títulos     as linhas sobem por trás de máscaras (o traço amarelo antes)
//   textos      aparecem subindo poucos pixels
//   abertura    apresentação: título → CAMINHOS. → textos
//   Solidez     construção: título → texto → Missão, Visão, Valores (cada
//               card com a sombra surgindo e o ícone logo depois) → a linha
//               é traçada → diferenciais 1 → 4, ícone e depois texto
//   Números     impacto: os cards 20+ e 250+ entram, contam e o brilho acende
//   depoimento  prova social: card → nome → estrelas uma a uma
//   chamada     conclusão: a textura assenta, título, texto e o botão
//   rodapé      eco da abertura, mais discreto: logo por máscara → texto →
//               colunas → contatos e redes → copyright e o traço dourado
//
// Os placeholders das fotos não são animados (as fotos terão a sua própria
// animação quando chegarem). A navbar não é tocada.

(function () {
  "use strict";

  var raiz = document.documentElement;

  function liberarAbertura() {
    raiz.classList.remove("abertura-animada");
  }

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  var SplitText = window.SplitText;

  if (!gsap || !ScrollTrigger || !SplitText || !document.querySelector(".sn-intro")) {
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

  // devolve os elementos ao CSS: sem transform, opacity, recorte nem sombra
  // inline (e sem o atributo style vazio)
  function limpar(elementos) {
    elementos.forEach(function (el) {
      if (!el) return;
      gsap.set(el, { clearProps: "transform,transformOrigin,translate,rotate,scale,opacity,clipPath,transition,minWidth" });
      el.style.removeProperty("--sombra");
      if (!el.getAttribute("style")) el.removeAttribute("style");
    });
  }

  // --- Títulos: linhas por trás de máscaras ----------------------------------
  // A divisão acontece na hora da entrada (as quebras são as reais daquele
  // momento) e é desfeita no fim.
  var divisoes = [];

  function dividir(titulo) {
    var divisao = SplitText.create(titulo, {
      type: "lines",
      mask: "lines",
      linesClass: "sn-linha",
    });
    titulo.classList.add("sn-mascarado");
    // 125%: a própria altura mais a folga da máscara (ver sobre-nos.css)
    gsap.set(divisao.lines, { yPercent: 125 });
    gsap.set(titulo, { opacity: 1 });
    divisoes.push({ titulo: titulo, divisao: divisao });
    return divisao;
  }

  function juntar(titulo) {
    divisoes = divisoes.filter(function (item) {
      if (item.titulo !== titulo) return true;
      item.divisao.revert();
      titulo.classList.remove("sn-mascarado");
      return false;
    });
    limpar([titulo]);
  }

  // anima as linhas de um título a partir de `posicao`; devolve o fim
  function linhas(tl, titulo, posicao, opcoes) {
    opcoes = opcoes || {};
    var divisao = dividir(titulo);
    var passo = opcoes.passo != null ? opcoes.passo : 0.12;
    var t = posicao;
    divisao.lines.forEach(function (linha) {
      // a linha com o destaque amarelo espera um instante a mais
      if (opcoes.destaque && linha.querySelector(opcoes.destaque)) t += opcoes.atrasoDestaque || 0;
      tl.to(linha, { yPercent: 0, duration: opcoes.duracao || 1.2, ease: "power3.out" }, t);
      t += passo;
    });
    tl.call(function () {}, null, t); // a timeline dura até a última linha
    return t;
  }

  // traço desenhado da esquerda para a direita
  function traco(tl, el, posicao, duracao) {
    tl.fromTo(
      el,
      { scaleX: 0, opacity: 1, transformOrigin: "0% 50%" },
      { scaleX: 1, duration: duracao || 0.9, ease: "power2.inOut" },
      posicao
    );
  }

  // Seções em fila: quando duas partes chegam juntas (rolagem rápida, tela
  // alta), a segunda espera a primeira começar. Devolve o atraso de início.
  function fila() {
    var livre = 0;
    return function (intervalo) {
      var agora = gsap.ticker.time;
      var inicio = Math.max(agora, livre);
      livre = inicio + intervalo;
      return inicio - agora;
    };
  }

  // gatilho único (once) que monta a timeline na hora da entrada
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

      // no mobile os deslocamentos e os intervalos encolhem
      var desktop = contexto.conditions.desktop;
      var k = desktop ? 1 : 0.6;
      var ritmo = desktop ? 1 : 0.8;

      // ======================================================================
      // 1. Abertura — Experiência que constrói novos caminhos
      // ======================================================================
      var intro = q(".sn-intro");
      var introRisco = q(".sn-intro__risco", intro);
      var introTitulo = q(".sn-intro__titulo", intro);
      var introTextos = qa(".sn-intro__paragrafo", intro);

      function abrir() {
        // estados iniciais explícitos; a classe do <html> sai na mesma passada
        gsap.set(introRisco, { scaleX: 0, opacity: 1, transformOrigin: "0% 50%" });
        gsap.set(introTextos, { y: 22 * k, opacity: 0 });
        liberarAbertura();

        var tl = gsap.timeline({
          defaults: { ease: "power3.out" },
          onComplete: function () {
            juntar(introTitulo);
            limpar([introRisco].concat(introTextos));
          },
        });

        traco(tl, introRisco, 0.1);
        // título linha a linha; CAMINHOS. entra um pouco depois
        var fim = linhas(tl, introTitulo, 0.25, {
          destaque: ".sn-destaque",
          atrasoDestaque: 0.22,
          duracao: 1.3,
        });
        tl.to(
          introTextos,
          { y: 0, opacity: 1, duration: 1.1, ease: "power2.out", stagger: 0.15 * ritmo },
          fim + 0.05
        );
      }

      // só espera as fontes, para as quebras de linha serem as finais
      // (teto de 1,5s: com rede lenta a abertura segue assim mesmo)
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
      // 2. Solidez em tudo o que fazemos — construção
      // ======================================================================
      var principios = q(".sn-principios");
      var solidezRisco = q(".sn-principios__risco", principios);
      var solidezTitulo = q(".sn-principios__titulo", principios);
      var solidezTexto = q(".sn-principios__intro", principios);
      var cards = qa(".sn-card", principios);
      var icones = cards.map(function (card) {
        return q(".sn-card__icone", card);
      });
      var divisor = q(".sn-principios__divisor", principios);
      var diferenciais = qa(".sn-diferencial", principios);
      var difIcones = diferenciais.map(function (item) {
        return q(".sn-diferencial__icone", item);
      });
      var difTextos = diferenciais.map(function (item) {
        return q(".sn-diferencial__texto", item);
      });

      var filaSolidez = fila();

      gsap.set([solidezRisco, divisor], { scaleX: 0, transformOrigin: "0% 50%" });
      gsap.set(solidezTitulo, { opacity: 0 });
      gsap.set(solidezTexto, { y: 18 * k, opacity: 0 });
      gsap.set(cards, { y: 28 * k, opacity: 0, "--sombra": 0, transition: "none" });
      gsap.set(icones, { y: 8 * k, opacity: 0 });
      gsap.set(difIcones, { y: 10 * k, opacity: 0 });
      gsap.set(difTextos, { x: -12 * k, opacity: 0 });

      aoEntrar(principios, desktop ? "top 72%" : "top 80%", function () {
        var tl = gsap.timeline({
          delay: filaSolidez(0.55),
          defaults: { ease: "power3.out" },
          onComplete: function () {
            juntar(solidezTitulo);
            limpar([solidezRisco, solidezTexto]);
          },
        });
        traco(tl, solidezRisco, 0);
        var fim = linhas(tl, solidezTitulo, 0.15);
        tl.to(solidezTexto, { y: 0, opacity: 1, duration: 1.1, ease: "power2.out" }, fim - 0.1);
      });

      // Missão → ícone → Visão → ícone → Valores → ícone
      aoEntrar(q(".sn-cards", principios) && cards[0], "top 85%", function () {
        var tl = gsap.timeline({
          delay: filaSolidez(desktop ? 0.9 : 0.4),
          onComplete: function () {
            limpar(cards.concat(icones));
          },
        });
        cards.forEach(function (card, i) {
          var t = i * 0.22 * ritmo;
          tl.to(card, { y: 0, opacity: 1, "--sombra": 1, duration: 1, ease: "power3.out" }, t);
          tl.to(icones[i], { y: 0, opacity: 1, duration: 0.7, ease: "power2.out" }, t + 0.3);
        });
      });

      // a linha é traçada e os diferenciais se montam, 1 → 4
      aoEntrar(divisor, desktop ? "top 88%" : "top 90%", function () {
        var tl = gsap.timeline({
          delay: filaSolidez(0.4),
          onComplete: function () {
            limpar([divisor].concat(difIcones, difTextos));
          },
        });
        traco(tl, divisor, 0, 1.1);
        diferenciais.forEach(function (item, i) {
          var t = 0.3 + i * 0.16 * ritmo;
          tl.to(difIcones[i], { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }, t);
          tl.to(difTextos[i], { x: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, t + 0.12);
        });
      });

      // ======================================================================
      // 3. Números que refletem confiança — impacto
      // ======================================================================
      var numeros = q(".sn-numeros");
      var numerosTitulo = q(".sn-numeros__titulo", numeros);
      var numerosTexto = q(".sn-numeros__intro", numeros);
      var marcas = q(".sn-marcas", numeros);
      var brilho = q(".sn-marcas__brilho", marcas);
      // cada card numérico: o SVG do card e o texto sobre ele entram juntos
      var cartoes = [
        [q(".sn-marcas__card--anos", marcas), q(".sn-marca--anos", marcas)],
        [q(".sn-marcas__card--obras", marcas), q(".sn-marca--obras", marcas)],
      ];
      var contadores = qa(".sn-marca__numero", marcas);
      var finais = contadores.map(function (el) {
        return el.textContent.trim();
      });

      var depoimento = q(".sn-depoimento", numeros);
      var depCard = q(".sn-depoimento__card", depoimento);
      var depTextos = [q(".sn-depoimento__nome", depoimento), q(".sn-depoimento__descricao", depoimento)];
      var estrelas = q(".sn-depoimento__estrelas", depoimento);
      var pontos = qa(".sn-depoimento__pontos img", depoimento);

      var filaNumeros = fila();

      gsap.set(numerosTitulo, { opacity: 0 });
      gsap.set(numerosTexto, { y: 18 * k, opacity: 0 });
      cartoes.forEach(function (par) {
        gsap.set(par, { y: 26 * k, opacity: 0 });
      });
      gsap.set(brilho, { opacity: 0 });
      gsap.set(depCard, { y: 22 * k, opacity: 0 });
      gsap.set(depTextos, { y: 10 * k, opacity: 0 });
      gsap.set(estrelas, { clipPath: "inset(0% 100% 0% 0%)" });
      gsap.set(pontos, { opacity: 0 });

      aoEntrar(numeros, desktop ? "top 72%" : "top 80%", function () {
        var tl = gsap.timeline({
          delay: filaNumeros(desktop ? 0.45 : 0.3),
          onComplete: function () {
            juntar(numerosTitulo);
            limpar([numerosTexto]);
          },
        });
        var fim = linhas(tl, numerosTitulo, 0);
        tl.to(numerosTexto, { y: 0, opacity: 1, duration: 1.1, ease: "power2.out" }, fim - 0.15);
      });

      // 20+ e 250+: os cards entram, os números contam uma vez só e, com o
      // 20+ no lugar, o brilho amarelo acende
      aoEntrar(marcas, "top 88%", function () {
        var tl = gsap.timeline({
          delay: filaNumeros(desktop ? 0.35 : 0.3),
          onComplete: function () {
            contadores.forEach(function (el, i) {
              el.textContent = finais[i];
            });
            limpar([brilho].concat(cartoes[0], cartoes[1], contadores.map(function (el) {
              return el.parentNode;
            })));
          },
        });

        cartoes.forEach(function (par, i) {
          var t = i * 0.18;
          tl.to(par, { y: 0, opacity: 1, duration: 1, ease: "power3.out" }, t);

          // contagem curta até o valor do HTML ("20+", "250+"); a largura do
          // bloco fica travada na final, sem nada se mexer em volta
          var el = contadores[i];
          var alvo = parseInt(finais[i], 10) || 0;
          var sufixo = finais[i].replace(/^\d+/, "");
          var bloco = el.parentNode;
          var contagem = { valor: 0 };
          gsap.set(bloco, { minWidth: bloco.getBoundingClientRect().width });
          el.textContent = "0" + sufixo;
          tl.to(
            contagem,
            {
              valor: alvo,
              duration: 1.1,
              ease: "power2.out",
              onUpdate: function () {
                el.textContent = Math.round(contagem.valor) + sufixo;
              },
              onComplete: function () {
                el.textContent = finais[i];
              },
            },
            t + 0.1
          );
        });

        tl.to(brilho, { opacity: 1, duration: 1.2, ease: "power1.inOut" }, 0.7);
      });

      // depoimento: card → nome e descrição → estrelas, uma a uma → pontos
      aoEntrar(depoimento, "top 88%", function () {
        var tl = gsap.timeline({
          delay: filaNumeros(0.3),
          onComplete: function () {
            limpar([depCard, estrelas].concat(depTextos, pontos));
          },
        });
        tl.to(depCard, { y: 0, opacity: 1, duration: 1, ease: "power3.out" }, 0);
        tl.to(depTextos, { y: 0, opacity: 1, duration: 0.8, ease: "power2.out", stagger: 0.08 }, 0.3);
        // cada estrela ocupa 1/5 da imagem: o recorte avança uma de cada vez
        for (var i = 1; i <= 5; i++) {
          tl.to(
            estrelas,
            { clipPath: "inset(0% " + (100 - i * 20) + "% 0% 0%)", duration: 0.16, ease: "power1.out" },
            0.5 + (i - 1) * 0.1
          );
        }
        tl.to(pontos, { opacity: 1, duration: 0.5, ease: "power1.out", stagger: 0.08 }, 1.05);
      });

      // ======================================================================
      // 4. O seu projeto em boas mãos — conclusão
      // ======================================================================
      var chamada = q(".sn-chamada");
      var textura = q(".sn-chamada__textura", chamada);
      var chamadaTitulo = q(".sn-chamada__titulo", chamada);
      var chamadaTexto = q(".sn-chamada__texto", chamada);
      var botao = q(".sn-chamada__botao", chamada);

      // a textura só desliza alguns pixels e ganha opacidade: ela é mais
      // larga que a seção, então nunca descobre a borda
      gsap.set(textura, { x: -24 * k, opacity: 0.55 });
      gsap.set(chamadaTitulo, { opacity: 0 });
      gsap.set(chamadaTexto, { y: 16 * k, opacity: 0 });
      gsap.set(botao, { y: 12 * k, opacity: 0 });

      aoEntrar(chamada, desktop ? "top 78%" : "top 82%", function () {
        var tl = gsap.timeline({
          onComplete: function () {
            juntar(chamadaTitulo);
            limpar([textura, chamadaTexto, botao]);
          },
        });
        tl.to(textura, { x: 0, opacity: 1, duration: 2.4, ease: "power2.out" }, 0);
        var fim = linhas(tl, chamadaTitulo, 0.1);
        tl.to(chamadaTexto, { y: 0, opacity: 1, duration: 1, ease: "power2.out" }, fim - 0.1);
        tl.to(botao, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" }, fim + 0.15);
      });

      // ======================================================================
      // 5. Rodapé — eco da abertura, mais discreto
      // ======================================================================
      var rodape = q(".rodape");
      var logo = q(".rodape__logo", rodape);
      var sobreTexto = q(".rodape__sobre", rodape);
      var colunasNav = [q(".rodape__coluna--navegacao", rodape), q(".rodape__coluna--servicos", rodape)];
      var contatos = [q(".rodape__coluna--contato", rodape), q(".rodape__sociais", rodape)];
      var copyright = q(".rodape__copyright", rodape);
      var rodapeRisco = q(".rodape__risco", rodape);

      // o logo sobe por trás de uma máscara parada: desce 100% e o recorte
      // esconde exatamente o que sai da própria caixa (como as linhas dos
      // títulos, sem precisar de outro elemento)
      gsap.set(logo, { yPercent: 100, clipPath: "inset(0% 0% 100% 0%)" });
      gsap.set([sobreTexto].concat(colunasNav, contatos), { y: 12 * k, opacity: 0 });
      gsap.set(copyright, { y: 8 * k, opacity: 0 });
      gsap.set(rodapeRisco, { scaleX: 0, transformOrigin: "0% 50%" });

      aoEntrar(rodape, "top 88%", function () {
        var tl = gsap.timeline({
          defaults: { ease: "power2.out" },
          onComplete: function () {
            limpar([logo, sobreTexto, copyright, rodapeRisco].concat(colunasNav, contatos));
          },
        });
        tl.to(logo, { yPercent: 0, clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "power3.out" }, 0);
        tl.to(sobreTexto, { y: 0, opacity: 1, duration: 0.9 }, 0.2);
        tl.to(colunasNav, { y: 0, opacity: 1, duration: 0.9, stagger: 0.1 * ritmo }, 0.35);
        tl.to(contatos, { y: 0, opacity: 1, duration: 0.9, stagger: 0.1 * ritmo }, 0.55);
        tl.to(copyright, { y: 0, opacity: 1, duration: 0.8 }, 0.8);
        traco(tl, rodapeRisco, 0.9, 0.8);
      });

      // trocar de faixa (resize) desfaz os estados; títulos voltam ao HTML
      return function () {
        divisoes.slice().forEach(function (item) {
          juntar(item.titulo);
        });
        contadores.forEach(function (el, i) {
          el.textContent = finais[i];
        });
      };
    }
  );
})();
