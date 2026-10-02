// GVT Cortes e Furos — animações da página Obras (GSAP + ScrollTrigger)
//
// O layout do CSS é o estado final de tudo. A experiência:
//
//   abertura   o título se abre de cima para baixo (máscara) e, em seguida,
//              o Projeto 01: a foto revelada de cima para baixo e o texto em
//              três grupos (título, descrição, dados), também por máscara.
//              Depois surgem o indicador 01 / 04 e "ROLE PARA EXPLORAR".
//
//   desktop    a área dos projetos vira uma JANELA pinada, com os quatro
//              projetos sobrepostos. O scroll (scrub) conduz as trocas:
//                · o texto do projeto atual sobe e sai; o do próximo entra
//                  por baixo, à mesma distância — uma pilha vertical;
//                · a foto nova sobe POR CIMA da atual, dentro do mesmo
//                  quadro, e a atual fica parada;
//                · uma linha de corte amarela de 1px acompanha a fronteira
//                  entre as duas fotos e só existe durante a troca;
//                · o número do indicador sobe e o seguinte entra por baixo.
//              Cada projeto tem uma pausa de leitura; a última é um pouco
//              maior, e então o pin solta e a página segue para o rodapé.
//              Parado, a foto responde ao cursor alguns pixels, por dentro
//              do quadro (object-position): o quadro não se mexe.
//
//   mobile     os projetos são mais altos que a tela: sem pin. A mesma ideia
//              vertical: ao rolar, cada foto é coberta de baixo para cima com
//              a linha de corte na fronteira (reversível), e o texto de cada
//              projeto se abre ao chegar à tela.
//
// Com prefers-reduced-motion nada disso roda: os quatro projetos ficam
// empilhados, como no HTML. A navbar não é tocada.

(function () {
  "use strict";

  var raiz = document.documentElement;

  function liberarAbertura() {
    raiz.classList.remove("abertura-animada");
  }

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  var pagina = document.querySelector(".ob-pagina");

  if (!gsap || !ScrollTrigger || !pagina) {
    liberarAbertura();
    return;
  }

  window.__gvtAbertura = true;
  gsap.registerPlugin(ScrollTrigger);

  function q(seletor, contexto) {
    return (contexto || document).querySelector(seletor);
  }

  function qa(seletor, contexto) {
    return gsap.utils.toArray((contexto || document).querySelectorAll(seletor));
  }

  function limpar(elementos) {
    elementos.forEach(function (el) {
      if (!el) return;
      gsap.set(el, { clearProps: "transform,translate,rotate,scale,opacity,clipPath,visibility" });
      if (!el.getAttribute("style")) el.removeAttribute("style");
    });
  }

  var titulo = q(".ob-titulo", pagina);
  var janela = q(".ob-projetos", pagina);
  var projetos = qa(".ob-projeto", pagina);
  var grupos = projetos.map(function (projeto) {
    return [
      q(".ob-projeto__titulo", projeto),
      q(".ob-projeto__descricao", projeto),
      q(".ob-projeto__dados", projeto),
    ];
  });
  var fotos = projetos.map(function (projeto) {
    return q(".ob-projeto__foto", projeto);
  });

  // máscara fechada (de cima para baixo) e aberta; a folga lateral e inferior
  // da aberta não corta acentos nem descendentes
  var FECHADA = "inset(0% 0% 100% 0%)";
  var ABERTA_TEXTO = "inset(-12% -4% -12% -4%)";
  var ABERTA = "inset(0% 0% 0% 0%)";

  function criar(html) {
    var caixa = document.createElement("div");
    caixa.innerHTML = html.trim();
    return caixa.firstChild;
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
      var criados = [];
      var desfazer = [];

      // ======================================================================
      // Abertura: título → Projeto 01
      // ======================================================================
      var tituloPronto = 0; // instante (relógio do GSAP) em que o título acaba

      function abrirTitulo() {
        gsap.set(titulo, { clipPath: "inset(-12% -4% 100% -4%)", y: -12 });
        liberarAbertura();
        tituloPronto = gsap.ticker.time + 1.1;
        gsap.to(titulo, {
          clipPath: "inset(-12% -4% -12% -4%)",
          y: 0,
          duration: 1.7,
          ease: "power2.out",
          onComplete: function () {
            limpar([titulo]);
          },
        });
      }

      // o Projeto 01 nasce fechado (o CSS da abertura já o recorta). No
      // mobile a foto dele é revelada pelo scroll, como as outras.
      var p1 = grupos[0];
      if (desktop) gsap.set(fotos[0], { clipPath: FECHADA });
      gsap.set(p1, { clipPath: FECHADA, y: 14 });

      var extras = []; // indicador e dica, que aparecem depois do Projeto 01

      function apresentarP1() {
        var atraso = Math.max(0, tituloPronto - gsap.ticker.time);
        var tl = gsap.timeline({
          delay: atraso,
          onComplete: function () {
            limpar(desktop ? [fotos[0]].concat(p1) : p1);
          },
        });
        if (desktop) tl.to(fotos[0], { clipPath: ABERTA, duration: 1.5, ease: "power3.inOut" }, 0);
        p1.forEach(function (grupo, i) {
          tl.to(grupo, { clipPath: ABERTA_TEXTO, y: 0, duration: 1.1, ease: "power3.out" }, 0.25 + i * 0.16);
        });
        if (extras.length) tl.to(extras, { opacity: 1, duration: 0.8, ease: "power1.out" }, 1.4);
      }

      var espera = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
      var teto = new Promise(function (ok) {
        setTimeout(ok, 1500);
      });
      // e, chegando de outra página, o conteúdo terminar de assentar (transicao.js)
      Promise.all([Promise.race([espera, teto]), window.gvtEntradaPronta]).then(function () {
        if (raiz.classList.contains("abertura-animada")) abrirTitulo();
        else limpar([titulo]);
      });

      // ======================================================================
      // Desktop: a janela pinada
      // ======================================================================
      if (desktop) {
        pagina.classList.add("ob-pagina--animada");

        var corte = criar('<div class="ob-corte" aria-hidden="true"></div>');
        var indicador = criar(
          '<div class="ob-indicador" aria-hidden="true">' +
            '<span class="ob-indicador__janela"><span class="ob-indicador__fita">' +
            projetos
              .map(function (_, i) {
                return "<span>" + String(i + 1).padStart(2, "0") + "</span>";
              })
              .join("") +
            "</span></span><span> / " + String(projetos.length).padStart(2, "0") + "</span></div>"
        );
        var dica = criar(
          '<div class="ob-dica" aria-hidden="true"><span class="ob-dica__conteudo">ROLE PARA EXPLORAR' +
            '<svg class="ob-dica__seta" viewBox="0 0 10 14" fill="none"><path d="M5 1v11M1 8.5 5 12.5l4-4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            "</span></div>"
        );
        [corte, indicador, dica].forEach(function (el) {
          janela.appendChild(el);
          criados.push(el);
        });
        var fita = q(".ob-indicador__fita", indicador);
        var dicaConteudo = q(".ob-dica__conteudo", dica);
        extras = [indicador, dica];
        gsap.set(extras, { opacity: 0 });

        // medidas (sem transform: offset*), recalculadas a cada refresh
        function alturaJanela() {
          return janela.offsetHeight;
        }
        function alturaFoto() {
          return fotos[0].offsetHeight;
        }
        function linha() {
          return fita.firstChild.offsetHeight;
        }

        // Onde a janela para: o conteúdo (foto de 729 a 19 do topo da janela)
        // centrado na área útil sob a navbar
        function inicioDoPin() {
          var nav = document.querySelector(".navbar").offsetHeight;
          var q = alturaFoto() / 729;
          var util = window.innerHeight - nav;
          var topo = nav + Math.max(0, (util - alturaFoto()) / 2) - 19 * q;
          return "top " + Math.round(topo) + "px";
        }

        // Ritmo, em alturas de tela de scroll: uma pausa curta depois que a
        // janela para, 3 trocas, pausas de leitura entre elas e uma final
        var R0 = 0.12;
        var T = 0.75;
        var R = 0.32;
        var RF = 0.38;
        var total = R0 + 3 * T + 2 * R + RF;
        var CURVA = "power2.inOut"; // sai firme e desacelera até encaixar

        var pausas = []; // [início, fim, projeto] de cada momento de leitura

        // estados iniciais dos projetos 02–04: textos uma janela abaixo, fotos
        // uma foto abaixo e recortadas — fora da área visível
        for (var i = 1; i < projetos.length; i++) {
          gsap.set(grupos[i], { y: alturaJanela });
          gsap.set(fotos[i], { yPercent: 100, clipPath: FECHADA });
        }

        var trilha = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: janela,
            pin: true,
            start: inicioDoPin,
            end: function () {
              return "+=" + Math.round(total * window.innerHeight);
            },
            scrub: 0.8,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        trilha.to({}, { duration: R0 });
        pausas.push([0, R0, 0]);

        projetos.slice(1).forEach(function (_, indice) {
          var n = indice + 1;
          var t0 = trilha.duration();
          if (n === 1) trilha.to(dicaConteudo, { opacity: 0, duration: 0.15 * T }, t0);

          // texto: três grupos, com uma diferença mínima entre eles (na
          // velocidade máxima, ~1.5% da troca já separa uns 20px)
          grupos[n].forEach(function (grupo, k) {
            var inicio = t0 + k * 0.015 * T;
            trilha.to(grupos[n - 1][k], { y: function () { return -alturaJanela(); }, duration: 0.85 * T, ease: CURVA }, inicio);
            trilha.fromTo(
              grupo,
              { y: function () { return alturaJanela(); } },
              { y: 0, duration: 0.85 * T, ease: CURVA, immediateRender: false },
              inicio
            );
          });

          // foto nova sobe por cima, dentro do quadro: desloca e o recorte
          // esconde exatamente o que passa da base do quadro
          trilha.fromTo(
            fotos[n],
            { yPercent: 100, clipPath: "inset(0% 0% 100% 0%)" },
            { yPercent: 0, clipPath: "inset(0% 0% 0% 0%)", duration: T, ease: CURVA, immediateRender: false },
            t0
          );

          // linha de corte na fronteira (o topo da foto nova)
          trilha.fromTo(
            corte,
            { y: alturaFoto },
            { y: 0, duration: T, ease: CURVA, immediateRender: false },
            t0
          );
          trilha.to(corte, { opacity: 1, duration: 0.06 * T }, t0);
          trilha.to(corte, { opacity: 0, duration: 0.08 * T }, t0 + 0.92 * T);

          // indicador: o número sobe e o seguinte entra
          trilha.to(fita, { y: function () { return -n * linha(); }, duration: 0.6 * T, ease: CURVA }, t0 + 0.2 * T);

          var p0 = t0 + T;
          var pausa = n === projetos.length - 1 ? RF : R;
          trilha.to({}, { duration: pausa }, p0);
          pausas.push([p0, p0 + pausa, n]);
        });

        // ------------------------------------------------------------------
        // Microinteração: parado, a foto responde ao cursor por dentro do
        // quadro (object-position, até 1.2% para cada lado). Um ouvinte só.
        // ------------------------------------------------------------------
        if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
          var mouse = { mx: 0 };
          var fotoAtual = null;

          function aplicar() {
            if (fotoAtual) fotoAtual.style.setProperty("--mx", mouse.mx.toFixed(3) + "%");
          }

          function mover(alvo) {
            gsap.to(mouse, { mx: alvo, duration: 0.7, ease: "power3.out", overwrite: true, onUpdate: aplicar });
          }

          function projetoParado() {
            var t = trilha.time();
            for (var j = 0; j < pausas.length; j++) {
              if (t >= pausas[j][0] - 0.001 && t <= pausas[j][1] + 0.001) return pausas[j][2];
            }
            return -1;
          }

          var aoMover = function (e) {
            var indice = projetoParado();
            var foto = indice >= 0 ? fotos[indice] : null;
            if (foto !== fotoAtual) {
              if (fotoAtual) fotoAtual.style.removeProperty("--mx");
              fotoAtual = foto;
              mouse.mx = 0;
            }
            if (!foto) return;
            var r = foto.getBoundingClientRect();
            var dentro = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
            mover(dentro ? ((e.clientX - r.left) / r.width * 2 - 1) * 1.2 : 0);
          };

          var aoSair = function () {
            mover(0);
          };

          // começou uma troca: a foto volta ao enquadramento
          var aoAtualizar = function () {
            if (fotoAtual && projetoParado() < 0) mover(0);
          };

          janela.addEventListener("pointermove", aoMover);
          janela.addEventListener("pointerleave", aoSair);
          trilha.eventCallback("onUpdate", aoAtualizar);

          desfazer.push(function () {
            janela.removeEventListener("pointermove", aoMover);
            janela.removeEventListener("pointerleave", aoSair);
            gsap.killTweensOf(mouse);
            fotos.forEach(function (foto) {
              foto.style.removeProperty("--mx");
              if (!foto.getAttribute("style")) foto.removeAttribute("style");
            });
          });
        }
      }

      // ======================================================================
      // Mobile: cada projeto ao chegar à tela
      // ======================================================================
      if (!desktop) {
        projetos.forEach(function (projeto, i) {
          var foto = fotos[i];
          var linhaCorte = criar('<div class="ob-corte ob-corte--movel" aria-hidden="true"></div>');
          projeto.appendChild(linhaCorte);
          criados.push(linhaCorte);

          // a linha mede a foto (topo e altura) a cada refresh
          function posicionar() {
            linhaCorte.style.top = foto.offsetTop + "px";
          }
          posicionar();
          ScrollTrigger.addEventListener("refreshInit", posicionar);
          desfazer.push(function () {
            ScrollTrigger.removeEventListener("refreshInit", posicionar);
          });

          // foto coberta de baixo para cima, ligada ao scroll (reversível)
          var revelar = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: foto,
              start: "top 92%",
              end: "top 45%",
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          });
          revelar.fromTo(foto, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1 }, 0);
          revelar.fromTo(linhaCorte, { y: function () { return foto.offsetHeight; } }, { y: 0, duration: 1 }, 0);
          revelar.fromTo(linhaCorte, { opacity: 0 }, { opacity: 1, duration: 0.06 }, 0);
          revelar.to(linhaCorte, { opacity: 0, duration: 0.08 }, 0.92);

          // texto: os três grupos se abrem de cima para baixo, uma vez
          if (i === 0) return; // o Projeto 01 já tem a sua entrada
          gsap.set(grupos[i], { clipPath: FECHADA, y: 10 });
          ScrollTrigger.create({
            trigger: projeto,
            start: "top 85%",
            once: true,
            onEnter: function () {
              gsap.to(grupos[i], {
                clipPath: ABERTA_TEXTO,
                y: 0,
                duration: 1,
                ease: "power3.out",
                stagger: 0.14,
                onComplete: function () {
                  limpar(grupos[i]);
                },
              });
            },
          });
        });
      }

      // a entrada do Projeto 01 (desktop e mobile)
      ScrollTrigger.create({
        trigger: projetos[0],
        start: "top 88%",
        once: true,
        onEnter: apresentarP1,
      });

      return function () {
        desfazer.forEach(function (f) {
          f();
        });
        criados.forEach(function (el) {
          el.remove();
        });
        pagina.classList.remove("ob-pagina--animada");
      };
    }
  );
})();
