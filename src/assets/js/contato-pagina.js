// GVT Cortes e Furos — animações da página Contato (GSAP + ScrollTrigger)
//
// Sem pin e sem scrub: o scroll é natural. Cada parte se apresenta UMA vez
// (gatilhos once) e, no fim, os estilos inline saem — o layout do CSS é o
// estado final de tudo. A linguagem é a das outras páginas, mais leve:
//
//   abertura   "Fale com a" se abre por máscara, de cima para baixo, quase
//              parado; "GVT." termina um instante depois → o subtítulo
//              surge → o selo SOLUÇÕES. / RESULTADOS / REAIS., linha a linha
//   cartões    WhatsApp → E-mail → Atendimento, cada um descoberto por uma
//              máscara vertical; por dentro, ícone → título → informações →
//              ação seguem a máscara, como uma apresentação só. No mobile
//              cada cartão entra quando chega à tela.
//   mapa       desktop: a animação principal: o mapa é descoberto de cima para baixo
//              (uma cortina da cor da página recolhe; o iframe não é
//              tocado), com uma linha amarela de 1px na fronteira; no fim a
//              linha some e cortina e linha são removidas — nada fica
//              sobre o mapa. Mobile: ONDE ESTAMOS., o traço, o mapa e o
//              link "Abrir no Google Maps" surgem num fade sutil.
//   rodapé     o eco discreto das outras páginas: logo → texto → colunas →
//              contatos e redes → copyright e o traço.
//
// Partes que chegam juntas (tela alta, rolagem rápida) entram em fila. As
// microinterações de hover são só CSS (contato-pagina.css). Com
// prefers-reduced-motion nada disso roda. A navbar não é tocada.

(function () {
  "use strict";

  var raiz = document.documentElement;

  function liberarAbertura() {
    raiz.classList.remove("abertura-animada");
  }

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  var pagina = document.querySelector(".ct-pagina");

  if (!gsap || !ScrollTrigger || !pagina) {
    liberarAbertura();
    return;
  }

  // desarma a trava de segurança do <head>
  window.__gvtAbertura = true;
  gsap.registerPlugin(ScrollTrigger);

  function q(seletor, contexto) {
    return (contexto || document).querySelector(seletor);
  }

  function qa(seletor, contexto) {
    return gsap.utils.toArray((contexto || document).querySelectorAll(seletor));
  }

  // devolve os elementos ao CSS (sem transform, opacity nem recorte inline)
  function limpar(elementos) {
    elementos.forEach(function (el) {
      if (!el) return;
      gsap.set(el, { clearProps: "transform,transformOrigin,opacity,clipPath,visibility" });
      if (!el.getAttribute("style")) el.removeAttribute("style");
    });
  }

  // máscaras: fechada embaixo (abre de cima para baixo) e aberta; a dos
  // textos tem folga para não cortar acentos e descendentes
  var FECHADA = "inset(0% 0% 100% 0%)";
  var ABERTA = "inset(0% 0% 0% 0%)";
  var FECHADA_TEXTO = "inset(-12% -4% 100% -4%)";
  var ABERTA_TEXTO = "inset(-12% -4% -12% -4%)";

  var titulo = q(".ct-titulo", pagina);
  var subtitulo = q(".ct-subtitulo", pagina);
  var selo = qa(".ct-selo span", pagina);
  var cartoes = qa(".ct-cartao", pagina);
  var mapa = q(".ct-mapa", pagina);
  // só no mobile: o título, o traço e o link do mapa
  var mapaExtras = [q(".ct-mapa-titulo", pagina), q(".ct-mapa-traco", pagina), q(".ct-mapa-link", pagina)];

  var rodape = q(".rodape");
  var logo = q(".rodape__logo", rodape);
  var sobreTexto = q(".rodape__sobre", rodape);
  var colunasNav = [q(".rodape__coluna--navegacao", rodape), q(".rodape__coluna--servicos", rodape)];
  var contatos = [q(".rodape__coluna--contato", rodape), q(".rodape__sociais", rodape)];
  var copyright = q(".rodape__copyright", rodape);
  var rodapeRisco = q(".rodape__risco", rodape);
  var rodapeTextos = [sobreTexto].concat(colunasNav, contatos);

  // conteúdo de cada cartão na ordem de leitura: ícone, título,
  // informações (rótulo, valor…) e a ação, quando existe
  function itensDe(cartao) {
    // (a seta de ação só existe no mobile)
    var seta = window.matchMedia("(max-width: 1023px)").matches ? ", .ct-cartao__seta" : "";
    return qa(
      ".ct-cartao__icone, .ct-cartao__titulo, .ct-cartao__rotulo, .ct-cartao__valor, .ct-cartao__acao" + seta,
      cartao
    );
  }

  // o iframe do mapa avisa quando carrega (o reveal espera por ele)
  var mapaCarregado = false;
  var aoCarregarMapa = [];
  var quadro = q(".ct-mapa__quadro", pagina);
  if (quadro) {
    quadro.addEventListener("load", function () {
      mapaCarregado = true;
      aoCarregarMapa.splice(0).forEach(function (seguir) {
        seguir();
      });
    }, { once: true });
  }

  // o que já se apresentou não se apresenta de novo (nem ao trocar de
  // faixa no resize: a página não fica inquieta)
  var revelados = new Set();

  // Fila: quando várias partes chegam juntas, cada uma espera a anterior
  // começar. Devolve o atraso de início.
  function fila() {
    var livre = 0;
    return function (intervalo) {
      var agora = gsap.ticker.time;
      var inicio = Math.max(agora, livre);
      livre = inicio + intervalo;
      return inicio - agora;
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

      // no mobile os deslocamentos encolhem
      var desktop = contexto.conditions.desktop;
      var k = desktop ? 1 : 0.6;
      var ativo = true;
      var criados = [];
      var proxima = fila();

      // a faixa anterior (resize) pode ter deixado atributos style vazios
      [pagina, rodape].forEach(function (bloco) {
        if (!bloco) return;
        bloco.querySelectorAll('[style=""]').forEach(function (el) {
          el.removeAttribute("style");
        });
      });

      // ======================================================================
      // Estados iniciais do que ainda não se apresentou
      // ======================================================================
      cartoes.forEach(function (cartao) {
        if (revelados.has(cartao)) return;
        gsap.set(cartao, { clipPath: FECHADA });
        gsap.set(itensDe(cartao), { y: 10 * k, opacity: 0 });
      });
      var cortina = null;
      if (!revelados.has(mapa)) {
        if (desktop) cortina = cobrirMapa();
        else gsap.set([mapa].concat(mapaExtras), { opacity: 0, y: 10 * k });
      }
      if (rodape && !revelados.has(rodape)) {
        // o logo sobe por trás de uma máscara parada, como nas outras páginas
        gsap.set(logo, { yPercent: 100, clipPath: FECHADA });
        gsap.set(rodapeTextos, { y: 12 * k, opacity: 0 });
        gsap.set(copyright, { y: 8 * k, opacity: 0 });
        gsap.set(rodapeRisco, { scaleX: 0, transformOrigin: "0% 50%" });
      }

      // ======================================================================
      // Cartões, mapa e rodapé — cada um quando chega à tela
      // ======================================================================
      function revelarCartao(cartao, atraso) {
        revelados.add(cartao);
        var itens = itensDe(cartao);
        var tl = gsap.timeline({
          delay: atraso,
          onComplete: function () {
            // o cartão só teve recorte: os transforms dele não são tocados
            // (o hover usa a propriedade translate, que o GSAP absorveria)
            gsap.set(cartao, { clearProps: "clipPath" });
            if (!cartao.getAttribute("style")) cartao.removeAttribute("style");
            limpar(itens);
          },
        });
        // a máscara desce e o conteúdo vem logo atrás dela, em sequência curta
        tl.to(cartao, { clipPath: ABERTA, duration: 1, ease: "power3.out" }, 0);
        tl.to(itens, { y: 0, opacity: 1, duration: 0.65, ease: "power2.out", stagger: 0.05 }, 0.1);
      }

      // A máscara do mapa é uma cortina da cor da página que recolhe para
      // baixo (só transform). Um recorte (clip-path) no container faria o
      // Chrome tratar o iframe como oculto e só pintar o mapa no fim; com a
      // cortina o mapa já está desenhado por baixo dela. Cortina e linha
      // são criadas aqui e removidas no fim: nada fica sobre o iframe.
      function cobrirMapa() {
        var cortina = document.createElement("span");
        cortina.className = "ct-mapa__cortina";
        cortina.setAttribute("aria-hidden", "true");
        mapa.appendChild(cortina);
        criados.push(cortina);
        mapa.classList.add("ct-mapa--coberto");
        return cortina;
      }

      // mobile: título, traço, mapa e link num fade curto, em sequência
      function revelarMapaMovel(atraso) {
        revelados.add(mapa);
        gsap.to(mapaExtras.slice(0, 2).concat(mapa, mapaExtras[2]), {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          stagger: 0.1,
          delay: atraso,
          onComplete: function () {
            limpar([mapa].concat(mapaExtras));
          },
        });
      }

      function revelarMapa(atraso) {
        if (!desktop) return revelarMapaMovel(atraso);
        revelados.add(mapa);
        var corte = document.createElement("span");
        corte.className = "ct-mapa__corte";
        corte.setAttribute("aria-hidden", "true");
        mapa.appendChild(corte);
        criados.push(corte);

        // cortina e linha andam juntas: um único valor (0 → 1) conduz as
        // duas; a linha fica na fronteira, sobre a primeira fileira coberta
        var estado = { t: 0 };
        var altura = 0;
        var tl = gsap.timeline({
          delay: atraso,
          paused: !mapaCarregado,
          onComplete: function () {
            corte.remove();
            cortina.remove();
            mapa.classList.remove("ct-mapa--coberto");
          },
        });
        tl.call(function () {
          altura = mapa.offsetHeight;
        }, null, 0);
        tl.set(corte, { opacity: 1 }, 0);
        tl.to(
          estado,
          {
            t: 1,
            duration: desktop ? 1.4 : 1.1,
            ease: "power2.inOut",
            onUpdate: function () {
              var t = estado.t;
              cortina.style.transform = "scaleY(" + (1 - t) + ")";
              corte.style.transform = "translateY(" + Math.min(t * altura, altura - 1) + "px)";
            },
          },
          0
        );
        tl.to(corte, { opacity: 0, duration: 0.4, ease: "power1.out" }, ">-0.1");

        // espera o mapa carregar (no máximo 1,2s), para não descobrir o fundo
        if (!mapaCarregado) {
          var seguir = function () {
            if (tl.paused()) tl.play();
          };
          aoCarregarMapa.push(seguir);
          gsap.delayedCall(1.2, seguir);
        }
      }

      function revelarRodape(atraso) {
        revelados.add(rodape);
        var tl = gsap.timeline({
          delay: atraso,
          defaults: { ease: "power2.out" },
          onComplete: function () {
            limpar([logo, copyright, rodapeRisco].concat(rodapeTextos));
          },
        });
        tl.to(logo, { yPercent: 0, clipPath: ABERTA, duration: 1, ease: "power3.out" }, 0);
        tl.to(sobreTexto, { y: 0, opacity: 1, duration: 0.9 }, 0.2);
        tl.to(colunasNav, { y: 0, opacity: 1, duration: 0.9, stagger: 0.1 }, 0.35);
        tl.to(contatos, { y: 0, opacity: 1, duration: 0.9, stagger: 0.1 }, 0.55);
        tl.to(copyright, { y: 0, opacity: 1, duration: 0.8 }, 0.8);
        tl.fromTo(
          rodapeRisco,
          { scaleX: 0, transformOrigin: "0% 50%" },
          { scaleX: 1, duration: 0.8, ease: "power2.inOut" },
          0.9
        );
      }

      // o que nasce depois (em callbacks) entra no contexto desta faixa,
      // para ser desfeito junto se ela mudar
      function noContexto(funcao) {
        return function () {
          var argumentos = arguments;
          if (!ativo) return;
          contexto.add(function () {
            funcao.apply(null, argumentos);
          });
        };
      }

      function aoEntrar(gatilho, inicio, revelar) {
        ScrollTrigger.create({ trigger: gatilho, start: inicio, once: true, onEnter: noContexto(revelar) });
      }

      // armados depois da abertura chegar aos cartões; o que já estiver na
      // tela entra na hora, em fila (WhatsApp → E-mail → Atendimento → mapa)
      function armarGatilhos() {
        if (!ativo) return;
        cartoes.forEach(function (cartao) {
          if (revelados.has(cartao)) return;
          aoEntrar(cartao, "top 90%", function () {
            revelarCartao(cartao, proxima(0.13));
          });
        });
        if (!revelados.has(mapa)) {
          aoEntrar(desktop ? mapa : mapaExtras[0], desktop ? "top 85%" : "top 90%", function () {
            revelarMapa(proxima(0.3));
          });
        }
        if (rodape && !revelados.has(rodape)) {
          aoEntrar(rodape, "top 88%", function () {
            revelarRodape(proxima(0.2));
          });
        }
      }

      // ======================================================================
      // Abertura — Fale com a GVT.
      // ======================================================================
      function abrir() {
        // o título inteiro se abre por máscara; "GVT" tem a sua própria
        // máscara, um instante atrasada (no <span> do HTML, sem dividir o
        // texto: o ponto final mantém o kerning junto do T)
        var marca = q(".ct-destaque", titulo);

        // estados explícitos; a classe do <html> sai na mesma passada
        gsap.set(titulo, { clipPath: FECHADA_TEXTO, y: -10 * k });
        gsap.set(marca, { clipPath: FECHADA_TEXTO });
        gsap.set(subtitulo, { y: 8 * k, opacity: 0 });
        gsap.set(selo, { y: 6 * k, opacity: 0 });
        liberarAbertura();

        var tl = gsap.timeline({
          onComplete: function () {
            limpar([titulo, marca, subtitulo].concat(selo));
          },
        });
        tl.to(titulo, { clipPath: ABERTA_TEXTO, y: 0, duration: 1.2, ease: "power2.out" }, 0);
        tl.to(marca, { clipPath: ABERTA_TEXTO, duration: 1.2, ease: "power2.out" }, 0.2);
        tl.to(subtitulo, { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" }, 0.55);
        tl.to(selo, { y: 0, opacity: 1, duration: 0.7, ease: "power2.out", stagger: 0.07 }, 0.7);
        tl.call(noContexto(armarGatilhos), null, 0.85);
      }

      if (raiz.classList.contains("abertura-animada")) {
        // espera as fontes (teto de 1,5s: com rede lenta segue assim mesmo)
        var espera = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
        var teto = new Promise(function (ok) {
          setTimeout(ok, 1500);
        });
        // e, chegando de outra página, o conteúdo terminar de assentar (transicao.js)
      Promise.all([Promise.race([espera, teto]), window.gvtEntradaPronta]).then(function () {
          if (!ativo) return;
          try {
            if (raiz.classList.contains("abertura-animada")) noContexto(abrir)();
            else noContexto(armarGatilhos)();
          } catch (erro) {
            liberarAbertura();
            armarGatilhos();
          }
        });
      } else {
        // sem abertura (#âncora, trava do <head> ou troca de faixa)
        armarGatilhos();
      }

      // trocar de faixa (resize, orientação) desfaz estados e gatilhos; o
      // que estava no meio da apresentação fica visível
      return function () {
        ativo = false;
        criados.forEach(function (el) {
          el.remove();
        });
        mapa.classList.remove("ct-mapa--coberto");
        liberarAbertura();
      };
    }
  );
})();
