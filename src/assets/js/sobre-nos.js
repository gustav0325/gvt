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
//   depoimento  prova social: card → mensagem e nome → estrelas uma a uma
//   chamada     conclusão: a textura assenta, título, texto e o botão
//   rodapé      eco da abertura, mais discreto: logo por máscara → texto →
//               colunas → contatos e redes → copyright e o traço dourado
//
// As três fotos do topo entram em sequência quando o mosaico chega à tela
// (entradaFotos, nos dois ramos). A navbar não é tocada.
//
// Mobile (até 1023px): um ramo próprio (montarMobile), elemento a elemento
// — a página vira uma coluna bem mais alta que a tela, então cada peça entra
// quando ela própria chega à vista: as fotos entram em sequência, com um fade
// curto, os cards de Missão/Visão/Valores um a um, os diferenciais na ordem
// da grade 2 x 2. O ramo do desktop continua o mesmo.

// --- Depoimentos: carrossel, um por vez -------------------------------------
// Os três ficam sobrepostos no card (altura fixa, nada em volta se mexe).
//   automático  passa ao próximo a cada 5s, em loop (3 → 1), só com o
//               carrossel à vista; pausa com o mouse sobre ele (card, setas,
//               indicadores) ou com o foco dentro, e qualquer troca manual
//               recomeça a contagem — um único setTimeout, nunca dois
//   manual      setas, indicadores, teclas ← → (foco no componente) e, no
//               toque, deslizar para o lado (o vertical segue rolando)
//   transição   o atual sai para o lado (opacity 1 → 0, 0 → -20px) e o
//               próximo entra do outro (opacity 0 → 1, 20px → 0) em 400ms;
//               voltando, o contrário. Web Animations, nativo; com
//               prefers-reduced-motion, só a opacidade, sem deslocamento
(function () {
  "use strict";

  var raiz = document.querySelector(".sn-depoimento");
  if (!raiz) return;

  var card = raiz.querySelector(".sn-depoimento__card");
  var slides = Array.prototype.slice.call(raiz.querySelectorAll(".sn-depoimento__slide"));
  var botoes = Array.prototype.slice.call(raiz.querySelectorAll(".sn-depoimento__indicador"));
  var setas = Array.prototype.slice.call(raiz.querySelectorAll(".sn-depoimento__seta"));
  var reduzido = window.matchMedia("(prefers-reduced-motion: reduce)");
  var total = slides.length;
  if (total < 2) return;

  var INTERVALO = 5000;
  var DURACAO = 400;
  var CURVA = "cubic-bezier(0.22, 1, 0.36, 1)";
  var LIMIAR = 48; // px na horizontal para valer como deslize

  var atual = 0;
  var relogio = 0;
  var visivel = false;
  var sobMouse = false;
  var comFoco = false;

  function marcar(indice) {
    botoes.forEach(function (botao, i) {
      if (i === indice) botao.setAttribute("aria-current", "true");
      else botao.removeAttribute("aria-current");
    });
  }

  function parado() {
    return !visivel || sobMouse || comFoco || document.hidden;
  }

  // (re)agenda a próxima troca automática; parado, não agenda nada.
  // Enquanto passa sozinho, o leitor de tela não anuncia cada troca.
  function agendar() {
    clearTimeout(relogio);
    card.setAttribute("aria-live", parado() ? "polite" : "off");
    if (parado()) return;
    relogio = setTimeout(function () {
      ir(atual + 1, 1);
    }, INTERVALO);
  }

  // deslocamento e opacidade em animações separadas: o que sai apaga antes
  // (220ms) e o novo aparece logo atrás (300ms, 100ms depois), enquanto os
  // dois deslizam os 400ms — sem os dois textos legíveis ao mesmo tempo
  function animar(el, opacidades, deslocamentos, tempo) {
    var reduz = reduzido.matches;
    var lista = [
      el.animate(
        opacidades.map(function (o) {
          return { opacity: o };
        }),
        { duration: reduz ? 200 : tempo.duracao, delay: reduz ? 0 : tempo.atraso, easing: "ease-out", fill: "both" }
      ),
    ];
    if (!reduz) {
      lista.push(
        el.animate(
          deslocamentos.map(function (x) {
            return { transform: "translateX(" + x + "px)" };
          }),
          { duration: DURACAO, easing: CURVA, fill: "both" }
        )
      );
    }
    return lista;
  }

  function ir(indice, sentido) {
    indice = (indice + total) % total;
    if (indice !== atual) trocar(indice, sentido || (indice > atual ? 1 : -1));
    agendar();
  }

  function trocar(indice, sentido) {
    var sai = slides[atual];
    var entra = slides[indice];
    // de onde o que sai está agora (pode estar no meio de uma troca)
    var opacidade = parseFloat(getComputedStyle(sai).opacity);
    atual = indice;
    marcar(indice);

    // trocas seguidas: o que não é nem o que sai nem o que entra some já
    slides.forEach(function (slide) {
      slide.getAnimations().forEach(function (a) {
        a.cancel();
      });
      if (slide !== sai && slide !== entra) slide.hidden = true;
    });
    entra.hidden = false;
    if (!sai.animate) {
      sai.hidden = true;
      return;
    }

    var dx = 20 * sentido;
    var saida = animar(sai, [opacidade, 0], [0, -dx], { duracao: 220, atraso: 0 });
    var entrada = animar(entra, [0, 1], [dx, 0], { duracao: 300, atraso: 100 });

    // terminado o mais longo, o que saiu se esconde e nada fica no estilo
    var fim = Promise.all(saida.concat(entrada).map(function (a) {
      return a.finished;
    }));
    fim.then(
      function () {
        if (slides[atual] !== sai) sai.hidden = true;
        saida.concat(entrada).forEach(function (a) {
          a.cancel();
        });
      },
      function () {
        // cancelada por outra troca: ela mesma arruma os slides
      }
    );
  }

  // --- controles ------------------------------------------------------------
  setas.forEach(function (seta) {
    seta.addEventListener("click", function () {
      var passo = parseInt(seta.getAttribute("data-passo"), 10) || 1;
      ir(atual + passo, passo);
    });
  });

  botoes.forEach(function (botao, i) {
    botao.addEventListener("click", function () {
      ir(i);
    });
  });

  // ← → com o foco no componente; nos indicadores, o foco acompanha
  raiz.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    var passo = e.key === "ArrowRight" ? 1 : -1;
    var noIndicador = botoes.indexOf(document.activeElement) !== -1;
    ir(atual + passo, passo);
    if (noIndicador) botoes[atual].focus();
  });

  // deslize no toque: só um gesto claramente horizontal e longo o bastante
  // (o vertical continua rolando a página: touch-action: pan-y no card)
  var inicio = null;
  card.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse") return;
    inicio = { x: e.clientX, y: e.clientY };
  });
  card.addEventListener("pointerup", function (e) {
    if (!inicio) return;
    var dx = e.clientX - inicio.x;
    var dy = e.clientY - inicio.y;
    inicio = null;
    if (Math.abs(dx) >= LIMIAR && Math.abs(dx) > Math.abs(dy) * 1.5) {
      var passo = dx < 0 ? 1 : -1;
      ir(atual + passo, passo);
    }
  });
  card.addEventListener("pointercancel", function () {
    inicio = null;
  });

  // --- pausa ----------------------------------------------------------------
  // mouse sobre o carrossel (card, setas e indicadores ficam dentro dele)
  raiz.addEventListener("pointerenter", function (e) {
    if (e.pointerType !== "mouse") return;
    sobMouse = true;
    agendar();
  });
  raiz.addEventListener("pointerleave", function (e) {
    if (e.pointerType !== "mouse") return;
    sobMouse = false;
    agendar();
  });
  // foco do teclado dentro dele (o clique também foca o botão, mas aí só
  // recomeça a contagem: pausa é para quem navega pelo teclado)
  raiz.addEventListener("focusin", function (e) {
    var teclado = true;
    try {
      teclado = e.target.matches(":focus-visible");
    } catch (erro) {
      // navegador sem :focus-visible: pausa com qualquer foco
    }
    comFoco = teclado;
    agendar();
  });
  raiz.addEventListener("focusout", function (e) {
    if (raiz.contains(e.relatedTarget)) return;
    comFoco = false;
    agendar();
  });
  // aba em segundo plano
  document.addEventListener("visibilitychange", agendar);
  // só passa sozinho com o carrossel à vista
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      function (entradas) {
        visivel = entradas[0].isIntersecting;
        agendar();
      },
      { threshold: 0.5 }
    ).observe(raiz);
  } else {
    visivel = true;
    agendar();
  }
})();

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
    // quebras escondidas pelo CSS (a do título de Números só vale no
    // mobile) sairiam como linhas a mais: saem durante a divisão e voltam
    // ao juntar
    var original = titulo.innerHTML;
    qa("br", titulo).forEach(function (br) {
      if (getComputedStyle(br).display === "none") br.remove();
    });
    var divisao = SplitText.create(titulo, {
      type: "lines",
      mask: "lines",
      linesClass: "sn-linha",
    });
    divisao.htmlOriginal = original;
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
      titulo.innerHTML = item.divisao.htmlOriginal;
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

  // As três fotos do topo, em sequência — a grande, a de cima, a de baixo —
  // quando o mosaico chega à tela (85% da altura): sobem 32px, de 97% a
  // 100%, sem bounce. Se isso acontece já na abertura da página, esperam
  // `atraso` (o título começar). Chamada antes de liberar a abertura.
  function entradaFotos(atraso) {
    var caixa = q(".sn-intro__fotos");
    var fotos = qa(".sn-foto", caixa);
    if (!fotos.length) return;
    gsap.set(fotos, { opacity: 0, y: 32, scale: 0.97, transformOrigin: "50% 60%" });
    var criado = gsap.ticker.time;
    aoEntrar(caixa, "top 85%", function () {
      gsap.to(fotos, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.12,
        delay: Math.max(0, atraso - (gsap.ticker.time - criado)),
        onComplete: function () {
          limpar(fotos);
        },
      });
    });
  }

  // espera as fontes (quebras de linha finais; teto de 1,5s) e, chegando de
  // outra página, o conteúdo terminar de assentar (transicao.js)
  function quandoPronto(abrir) {
    var espera = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    var teto = new Promise(function (ok) {
      setTimeout(ok, 1500);
    });
    Promise.all([Promise.race([espera, teto]), window.gvtEntradaPronta]).then(function () {
      try {
        if (raiz.classList.contains("abertura-animada")) abrir();
      } catch (erro) {
        liberarAbertura();
      }
    });
  }

  // ==========================================================================
  // Mobile — elemento a elemento, deslocamentos curtos
  // ==========================================================================
  function montarMobile() {
    var curva = "power3.out";

    // um elemento (ou grupo) que sobe alguns pixels e aparece quando chega
    // à tela; `fila` evita que vários estourem juntos numa rolagem rápida
    function revelar(elementos, gatilho, opcoes) {
      opcoes = opcoes || {};
      var lista = [].concat(elementos).filter(Boolean);
      if (!lista.length) return;
      gsap.set(lista, { y: opcoes.y != null ? opcoes.y : 16, opacity: 0 });
      aoEntrar(gatilho || lista[0], opcoes.inicio || "top 90%", function () {
        gsap.to(lista, {
          y: 0,
          opacity: 1,
          duration: opcoes.duracao || 0.8,
          ease: opcoes.ease || curva,
          stagger: opcoes.stagger || 0,
          delay: opcoes.fila ? opcoes.fila(opcoes.intervalo || 0.15) : 0,
          onComplete: function () {
            limpar(lista);
          },
        });
      });
    }

    // --- 1. Experiência: traço e SOBRE A GVT → título → textos → fotos -----
    var intro = q(".sn-intro");
    var introRisco = q(".sn-intro__risco", intro);
    var introRotulo = q(".sn-intro__rotulo", intro);
    var introTitulo = q(".sn-intro__titulo", intro);
    var introTextos = qa(".sn-intro__paragrafo", intro);

    function abrir() {
      gsap.set(introRisco, { scaleX: 0, opacity: 1, transformOrigin: "0% 50%" });
      gsap.set(introRotulo, { x: -8, opacity: 0 });
      gsap.set(introTextos, { y: 14, opacity: 0 });
      // as fotos ficam abaixo dos textos: à vista na chegada, entram depois deles
      entradaFotos(1.1);
      liberarAbertura();

      var tl = gsap.timeline({
        defaults: { ease: curva },
        onComplete: function () {
          juntar(introTitulo);
          limpar([introRisco, introRotulo].concat(introTextos));
        },
      });
      traco(tl, introRisco, 0.1, 0.7);
      tl.to(introRotulo, { x: 0, opacity: 1, duration: 0.6, ease: "power2.out" }, 0.35);
      var fim = linhas(tl, introTitulo, 0.3, {
        destaque: ".sn-destaque",
        atrasoDestaque: 0.18,
        duracao: 1.1,
        passo: 0.1,
      });
      tl.to(introTextos, { y: 0, opacity: 1, duration: 0.9, ease: "power2.out", stagger: 0.14 }, fim);
    }

    quandoPronto(abrir);

    // --- 2. Solidez --------------------------------------------------------
    var principios = q(".sn-principios");
    var solidezRisco = q(".sn-principios__risco", principios);
    var solidezTitulo = q(".sn-principios__titulo", principios);
    var solidezTexto = q(".sn-principios__intro", principios);
    var cards = qa(".sn-card", principios);
    var divisor = q(".sn-principios__divisor", principios);
    var diferenciais = qa(".sn-diferencial", principios);
    var filaSolidez = fila();

    gsap.set(solidezRisco, { scaleX: 0, transformOrigin: "0% 50%" });
    gsap.set(solidezTitulo, { opacity: 0 });
    gsap.set(solidezTexto, { y: 14, opacity: 0 });

    aoEntrar(principios, "top 82%", function () {
      var tl = gsap.timeline({
        delay: filaSolidez(0.4),
        defaults: { ease: curva },
        onComplete: function () {
          juntar(solidezTitulo);
          limpar([solidezRisco, solidezTexto]);
        },
      });
      traco(tl, solidezRisco, 0, 0.7);
      var fim = linhas(tl, solidezTitulo, 0.1, { duracao: 1.1, passo: 0.1 });
      tl.to(solidezTexto, { y: 0, opacity: 1, duration: 0.9, ease: "power2.out" }, fim - 0.1);
    });

    // Missão, Visão e Valores: cada um quando chega
    cards.forEach(function (card) {
      revelar(card, card, { y: 18, fila: filaSolidez, intervalo: 0.12 });
    });

    // a linha é traçada; os diferenciais entram na ordem da grade (linha a
    // linha, da esquerda para a direita)
    gsap.set(divisor, { scaleX: 0, transformOrigin: "0% 50%" });
    aoEntrar(divisor, "top 92%", function () {
      gsap.to(divisor, {
        scaleX: 1,
        duration: 0.9,
        ease: "power2.inOut",
        delay: filaSolidez(0.2),
        onComplete: function () {
          limpar([divisor]);
        },
      });
    });
    for (var linha = 0; linha < diferenciais.length; linha += 2) {
      revelar(diferenciais.slice(linha, linha + 2), diferenciais[linha], {
        y: 16,
        stagger: 0.1,
        fila: filaSolidez,
        intervalo: 0.18,
        inicio: "top 92%",
      });
    }

    // --- 3. Números ----------------------------------------------------------
    var numeros = q(".sn-numeros");
    var numerosRisco = q(".sn-numeros__risco", numeros);
    var numerosTitulo = q(".sn-numeros__titulo", numeros);
    var numerosTexto = q(".sn-numeros__intro", numeros);
    var marcas = q(".sn-marcas", numeros);
    var brilho = q(".sn-marcas__brilho", marcas);
    var cartoes = [
      [q(".sn-marcas__card--anos", marcas), q(".sn-marca--anos", marcas)],
      [q(".sn-marcas__card--obras-mobile", marcas), q(".sn-marca--obras", marcas)],
    ];
    var contadores = qa(".sn-marca__numero", marcas);
    var finais = contadores.map(function (el) {
      return el.textContent.trim();
    });
    var depoimento = q(".sn-depoimento", numeros);
    var filaNumeros = fila();

    gsap.set(numerosRisco, { scaleX: 0, transformOrigin: "0% 50%" });
    gsap.set(numerosTitulo, { opacity: 0 });
    gsap.set(numerosTexto, { y: 14, opacity: 0 });
    cartoes.forEach(function (par) {
      gsap.set(par, { y: 18, opacity: 0 });
    });
    gsap.set(brilho, { opacity: 0 });

    aoEntrar(numeros, "top 82%", function () {
      var tl = gsap.timeline({
        delay: filaNumeros(0.3),
        defaults: { ease: curva },
        onComplete: function () {
          juntar(numerosTitulo);
          limpar([numerosRisco, numerosTexto]);
        },
      });
      traco(tl, numerosRisco, 0, 0.7);
      var fim = linhas(tl, numerosTitulo, 0.1, { duracao: 1.1, passo: 0.1 });
      tl.to(numerosTexto, { y: 0, opacity: 1, duration: 0.9, ease: "power2.out" }, fim - 0.1);
    });

    // 20+ e 250+: entram, contam uma vez e o brilho do 20+ acende
    aoEntrar(marcas, "top 90%", function () {
      var tl = gsap.timeline({
        delay: filaNumeros(0.3),
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
        var t = i * 0.15;
        tl.to(par, { y: 0, opacity: 1, duration: 0.9, ease: curva }, t);
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
      tl.to(brilho, { opacity: 1, duration: 1.1, ease: "power1.inOut" }, 0.6);
    });

    // depoimento: a caixa inteira, como um bloco
    revelar(depoimento, depoimento, { y: 18, fila: filaNumeros, intervalo: 0.2 });

    // --- 4. Chamada -----------------------------------------------------------
    var chamada = q(".sn-chamada");
    var textura = q(".sn-chamada__textura", chamada);
    var chamadaRisco = q(".sn-chamada__risco", chamada);
    var chamadaTitulo = q(".sn-chamada__titulo", chamada);
    var chamadaTexto = q(".sn-chamada__texto", chamada);
    var botao = q(".sn-chamada__botao", chamada);

    gsap.set(textura, { opacity: 0.55 });
    gsap.set(chamadaRisco, { scaleX: 0, transformOrigin: "0% 50%" });
    gsap.set(chamadaTitulo, { opacity: 0 });
    gsap.set(chamadaTexto, { y: 14, opacity: 0 });
    gsap.set(botao, { y: 10, opacity: 0 });

    aoEntrar(chamada, "top 80%", function () {
      var tl = gsap.timeline({
        defaults: { ease: curva },
        onComplete: function () {
          juntar(chamadaTitulo);
          limpar([textura, chamadaRisco, chamadaTexto, botao]);
        },
      });
      tl.to(textura, { opacity: 1, duration: 1.6, ease: "power2.out" }, 0);
      traco(tl, chamadaRisco, 0.05, 0.7);
      var fim = linhas(tl, chamadaTitulo, 0.15, { duracao: 1.1, passo: 0.1 });
      tl.to(chamadaTexto, { y: 0, opacity: 1, duration: 0.9, ease: "power2.out" }, fim - 0.1);
      tl.to(botao, { y: 0, opacity: 1, duration: 0.8 }, fim + 0.1);
    });

    // --- 5. Rodapé (o mesmo da Home): cada parte quando chega ----------------
    var rodape = q(".rodape");
    var filaRodape = fila();
    revelar(q(".rodape__logo", rodape), null, { y: 12, fila: filaRodape });
    revelar(q(".rodape__sobre", rodape), null, { y: 12, fila: filaRodape });
    revelar(q(".rodape__sociais", rodape), null, { y: 12, fila: filaRodape });
    revelar([q(".rodape__coluna--servicos", rodape), q(".rodape__coluna--contato", rodape)], q(".rodape__coluna--servicos", rodape), {
      y: 12,
      stagger: 0.1,
      fila: filaRodape,
    });
    revelar(q(".rodape__copyright", rodape), null, { y: 8, fila: filaRodape, inicio: "top 99%" });

    return function () {
      divisoes.slice().forEach(function (item) {
        juntar(item.titulo);
      });
      contadores.forEach(function (el, i) {
        el.textContent = finais[i];
      });
    };
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

      // no mobile, o ramo próprio (abaixo)
      var desktop = contexto.conditions.desktop;
      if (!desktop) return montarMobile();
      var k = 1;
      var ritmo = 1;

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
        // o mosaico, ao lado do título, entra quando o título começa
        entradaFotos(0.45);
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

      // (o primeiro depoimento, o que está à vista na chegada)
      var depoimento = q(".sn-depoimento", numeros);
      var depCard = q(".sn-depoimento__card", depoimento);
      var depTextos = [q(".sn-depoimento__mensagem", depoimento), q(".sn-depoimento__nome", depoimento)];
      var estrelas = q(".sn-depoimento__estrelas", depoimento);
      var pontos = qa(".sn-depoimento__seta, .sn-depoimento__indicador", depoimento);

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

      // depoimento: card → mensagem e nome → estrelas, uma a uma → pontos
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
