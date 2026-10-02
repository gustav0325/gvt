// GVT Cortes e Furos — animações das páginas individuais de serviço
// (GSAP + ScrollTrigger + SplitText)
//
// O layout do CSS é o estado final de tudo: as animações partem de estados
// inline e, ao terminar, devolvem cada elemento ao CSS. Sem pin e sem scroll
// horizontal; o scroll continua natural.
//
// Uma parte é COMPARTILHADA pelas quatro páginas — a identidade da GVT:
//   rótulos       revelação vertical discreta (e o traço amarelo se estende)
//   títulos       linha a linha, descendo para dentro de máscaras
//   textos        opacidade + deslocamento mínimo
//   CTA           a textura se abre → título → texto → botão
//   outros        os cartões em sequência
//   rodapé        a mesma entrada discreta das outras páginas
//
// E cada serviço tem a SUA identidade (data-servico no .sd-pagina), nas
// partes ligadas à técnica — Hero, ilustração, aplicações e diferenciais:
//   fio        linearidade: o título desce linha a linha; a ilustração é
//              revelada de cima para baixo pelo scroll e os diferenciais se
//              ativam um a um, da esquerda para a direita
//   disco      radial: a foto se abre num círculo a partir do disco; a
//              ilustração também, e um contorno marca o disco uma vez
//   furos      profundidade: a foto se abre a partir do ponto da perfuração,
//              em dois tempos (fura, depois abre); um contorno marca o furo
//   demolicao  estrutura: a foto é montada em três faixas; a ilustração sobe
//              de baixo para cima; as aplicações são etapas, uma a uma, no
//              ritmo do scroll
//
// As ilustrações técnicas são imagens únicas (linhas e legendas fazem parte
// delas): são animadas como composição, sem recortes artificiais.
//
// Com prefers-reduced-motion nada disso roda. A navbar não é tocada; a
// abertura espera a transição entre páginas terminar (window.gvtEntradaPronta).

(function () {
  "use strict";

  var raiz = document.documentElement;

  function liberarAbertura() {
    raiz.classList.remove("abertura-animada");
  }

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  var SplitText = window.SplitText;
  var pagina = document.querySelector(".sd-pagina");

  if (!gsap || !ScrollTrigger || !SplitText || !pagina) {
    liberarAbertura();
    return;
  }

  // desarma a trava de segurança do <head>
  window.__gvtAbertura = true;
  gsap.registerPlugin(ScrollTrigger, SplitText);

  var servico = pagina.getAttribute("data-servico");

  function q(seletor, contexto) {
    return (contexto || document).querySelector(seletor);
  }

  function qa(seletor, contexto) {
    return gsap.utils.toArray((contexto || document).querySelectorAll(seletor));
  }

  // devolve os elementos ao CSS (sem transform, opacity nem recorte inline;
  // as variáveis de layout que já estavam no style ficam)
  function limpar(elementos) {
    elementos.forEach(function (el) {
      if (!el) return;
      gsap.set(el, { clearProps: "transform,transformOrigin,opacity,clipPath,visibility" });
      if (!el.getAttribute("style")) el.removeAttribute("style");
    });
  }

  function criar(classe, pai) {
    var el = document.createElement("span");
    el.className = classe;
    el.setAttribute("aria-hidden", "true");
    pai.appendChild(el);
    return el;
  }

  // Ponto de uma imagem com object-fit: cover, dado em pixels da imagem
  // original (data-foco), convertido para a caixa do elemento — vale em
  // qualquer largura, inclusive com o enquadramento do mobile
  function foco(img) {
    var dados = (img.getAttribute("data-foco") || "").split(" ").map(Number);
    var bw = img.clientWidth;
    var bh = img.clientHeight;
    var nw = img.naturalWidth || +img.getAttribute("width");
    var nh = img.naturalHeight || +img.getAttribute("height");
    var escala = Math.max(bw / nw, bh / nh);
    var posicao = getComputedStyle(img).objectPosition.split(" ");
    var px = parseFloat(posicao[0]) / 100;
    var py = parseFloat(posicao[1] || posicao[0]) / 100;
    var x = (bw - nw * escala) * px + (dados[0] || nw / 2) * escala;
    var y = (bh - nh * escala) * py + (dados[1] || nh / 2) * escala;
    // raio que alcança o canto mais distante da caixa
    var alcance = Math.max(Math.hypot(x, y), Math.hypot(bw - x, y), Math.hypot(x, bh - y), Math.hypot(bw - x, bh - y));
    return { x: x, y: y, raio: (dados[2] || 0) * escala, alcance: alcance };
  }

  function circulo(img, raio) {
    var f = foco(img);
    return "circle(" + (raio === "todo" ? f.alcance + 2 : raio) + "px at " + f.x + "px " + f.y + "px)";
  }

  // --- Títulos em linhas, por trás de máscaras ------------------------------
  var divisoes = [];

  function dividir(titulo) {
    // quebras fixas escondidas pelo CSS (no mobile o texto quebra sozinho)
    // sairiam como linhas a mais: saem durante a divisão e voltam ao juntar
    var original = titulo.innerHTML;
    qa("br", titulo).forEach(function (br) {
      if (getComputedStyle(br).display === "none") br.remove();
    });
    var divisao = SplitText.create(titulo, { type: "lines", mask: "lines", linesClass: "sd-linha" });
    divisao.htmlOriginal = original;
    titulo.classList.add("sd-mascarado");
    // acima da máscara inteira (a folga dela é de 0.22em sobre a linha)
    gsap.set(divisao.lines, { yPercent: -150 });
    gsap.set(titulo, { opacity: 1 });
    divisoes.push({ titulo: titulo, divisao: divisao });
    return divisao.lines;
  }

  function juntar(titulo) {
    divisoes = divisoes.filter(function (item) {
      if (item.titulo !== titulo) return true;
      item.divisao.revert();
      titulo.innerHTML = item.divisao.htmlOriginal;
      titulo.classList.remove("sd-mascarado");
      return false;
    });
    limpar([titulo]);
  }

  // as linhas descem para dentro das máscaras (de cima para baixo); devolve
  // o instante em que a última termina
  function linhas(tl, titulo, inicio, passo, duracao) {
    var lista = dividir(titulo);
    passo = passo == null ? 0.12 : passo;
    duracao = duracao || 0.8;
    lista.forEach(function (linha, i) {
      tl.to(linha, { yPercent: 0, duration: duracao, ease: "power3.out" }, inicio + i * passo);
    });
    return inicio + (lista.length - 1) * passo + duracao;
  }

  // rótulo: revelação vertical discreta; o traço amarelo se estende
  function rotulo(tl, el, traco, inicio) {
    if (el) {
      tl.fromTo(
        el,
        { clipPath: "inset(0% 0% 100% 0%)", y: -6, opacity: 1 },
        { clipPath: "inset(0% 0% -25% 0%)", y: 0, duration: 0.6, ease: "power2.out" },
        inicio
      );
    }
    if (traco) {
      tl.fromTo(traco, { scaleX: 0, opacity: 1, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 0.6, ease: "power2.inOut" }, inicio + 0.1);
    }
  }

  // texto: opacidade + deslocamento mínimo
  function texto(tl, el, inicio, de) {
    tl.fromTo(el, Object.assign({ opacity: 0, y: 12 }, de || {}), { opacity: 1, x: 0, y: 0, duration: 0.65, ease: "power2.out" }, inicio);
  }

  // partes que chegam juntas (tela alta, rolagem rápida) entram em fila
  function fila() {
    var livre = 0;
    return function (intervalo) {
      var agora = gsap.ticker.time;
      var inicio = Math.max(agora, livre);
      livre = inicio + intervalo;
      return inicio - agora;
    };
  }

  // o que já se apresentou não se apresenta de novo (nem ao trocar de faixa)
  var revelados = new Set();

  // títulos só se dividem em linhas com as fontes finais (com a de reserva
  // as quebras seriam outras e o título mudaria de altura ao juntar);
  // teto de 1,5s para rede lenta
  var fontesProntas = Promise.race([
    document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
    new Promise(function (ok) {
      setTimeout(ok, 1500);
    }),
  ]);

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
      var k = desktop ? 1 : 0.6; // deslocamentos menores no mobile
      var ativo = true;
      var criados = [];
      var proxima = fila();

      // o que nasce em callbacks entra no contexto desta faixa
      function noContexto(funcao) {
        return function () {
          var argumentos = arguments;
          if (!ativo) return;
          contexto.add(function () {
            funcao.apply(null, argumentos);
          });
        };
      }

      function aoEntrar(chave, gatilho, inicio, montar, intervalo) {
        if (revelados.has(chave) || !gatilho) return;
        ScrollTrigger.create({
          trigger: gatilho,
          start: inicio,
          once: true,
          onEnter: function () {
            revelados.add(chave);
            fontesProntas.then(
              noContexto(function () {
                montar(proxima(intervalo == null ? 0.25 : intervalo));
              })
            );
          },
        });
      }

      // Revelação das ilustrações. Desktop (texto e ilustração lado a lado):
      // começa quando a seção A Técnica entra pela base da tela e termina
      // quando o topo dela encosta na base da navbar fixa. Mobile (a
      // ilustração fica abaixo do texto): começa quando a própria ilustração
      // entra pela base e termina quando ela está inteira à vista.
      var navbar = q(".navbar");
      function faixaIlustracao(extra) {
        return Object.assign(
          {
            trigger: desktop ? tecnica : quadro,
            start: "top bottom",
            end: desktop
              ? function () {
                  return "top " + (navbar ? navbar.offsetHeight : 0) + "px";
                }
              : "bottom bottom",
            scrub: 0.4,
            invalidateOnRefresh: true,
          },
          extra || {}
        );
      }

      function temporario(classe, pai) {
        var el = criar(classe, pai);
        criados.push(el);
        return el;
      }

      // ======================================================================
      // Elementos de cada seção
      // ======================================================================
      var hero = q(".sd-hero", pagina);
      var heroFoto = q(".sd-hero__foto", hero);
      var migalha = q(".sd-migalha", hero);
      var heroTraco = q(".sd-traco", hero);
      var heroTitulo = q(".sd-hero__titulo", hero);
      var heroDescricao = q(".sd-hero__descricao", hero);

      var tecnica = q(".sd-tecnica", pagina);
      var tecRotulo = q(".sd-rotulo", tecnica);
      var tecTraco = q(".sd-traco", tecnica);
      var tecTitulo = q(".sd-tecnica__titulo", tecnica);
      var tecParagrafo = q(".sd-tecnica__paragrafo", tecnica);
      var quadro = q(".sd-tecnica__quadro", tecnica);
      var ilustracao = q("img", quadro);

      var aplicacoes = q(".sd-aplicacoes", pagina);
      var apRotulo = q(".sd-rotulo", aplicacoes);
      var apTraco = q(".sd-traco", aplicacoes);
      var apTitulo = q(".sd-titulo-secao", aplicacoes);
      var apLista = q(".sd-aplicacoes__lista", aplicacoes);
      var cartoes = qa(".sd-aplicacao", aplicacoes);

      var diferenciais = q(".sd-diferenciais", pagina);
      var difRotulo = q(".sd-rotulo", diferenciais);
      var difTraco = q(".sd-traco", diferenciais);
      var difTitulo = q(".sd-titulo-secao", diferenciais);
      var fila3 = q(".sd-diferenciais__fila", diferenciais);
      var itensDif = qa(".sd-diferencial", diferenciais);
      var divisores = qa(".sd-diferenciais__divisor", diferenciais);

      var cta = q(".sd-cta", pagina);
      var outros = q(".sd-outros", pagina);

      function partesCartao(cartao) {
        return {
          icone: q(".sd-icone", cartao),
          titulo: q(".sd-aplicacao__titulo", cartao),
          texto: q(".sd-aplicacao__texto", cartao),
        };
      }

      function partesDif(item) {
        return {
          icone: q(".sd-icone", item),
          valor: q(".sd-diferencial__valor", item),
          texto: q(".sd-diferencial__texto", item),
        };
      }

      // ======================================================================
      // Identidades de cada serviço
      // ======================================================================
      var identidades = {
        // ------------------------------------------------------------------
        // FIO DIAMANTADO — linearidade, continuidade e precisão
        // ------------------------------------------------------------------
        fio: {
          // breadcrumb e traço, o título desce linha a linha, o texto por fim
          hero: function (tl) {
            rotulo(tl, migalha, heroTraco, 0);
            var fim = linhas(tl, heroTitulo, 0.35, 0.14, 0.9);
            texto(tl, heroDescricao, fim - 0.35);
          },
          // a ilustração é revelada de cima para baixo no ritmo do scroll
          ilustracao: function () {
            gsap.fromTo(
              ilustracao,
              { clipPath: "inset(0% 0% 100% 0%)" },
              {
                clipPath: "inset(0% 0% 0% 0%)",
                ease: "none",
                scrollTrigger: faixaIlustracao(),
              }
            );
          },
          // os cartões entram da esquerda para a direita
          cartaoInicial: { opacity: 0, x: -18 * k },
          cartao: function (tl, cartao, inicio) {
            tl.to(cartao, { opacity: 1, x: 0, duration: 0.65, ease: "power2.out" }, inicio);
          },
          passoCartoes: 0.14,
          // os diferenciais se ativam um a um, da esquerda para a direita,
          // num ritmo contínuo — ícone, título, descrição
          difInicial: function (p) {
            gsap.set([p.icone, p.valor, p.texto], { opacity: 0, y: 10 * k });
          },
          dif: function (tl, p, inicio) {
            tl.to(p.icone, { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" }, inicio);
            tl.to(p.valor, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, inicio + 0.12);
            tl.to(p.texto, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, inicio + 0.24);
          },
          passoDif: 0.42,
        },

        // ------------------------------------------------------------------
        // DISCO DIAMANTADO — movimento radial e agilidade
        // ------------------------------------------------------------------
        disco: {
          // a foto se abre num círculo a partir do disco, rápida e contida;
          // CORTE COM, depois DISCO DIAMANTADO, depois o texto
          hero: function (tl) {
            tl.fromTo(
              heroFoto,
              { clipPath: circulo(heroFoto, 0) },
              { clipPath: circulo(heroFoto, "todo"), duration: 1.05, ease: "power3.inOut" },
              0
            );
            rotulo(tl, migalha, heroTraco, 0.55);
            var fim = linhas(tl, heroTitulo, 0.7, 0.18, 0.75);
            texto(tl, heroDescricao, fim - 0.3);
          },
          // a ilustração também se abre em círculo, a partir do disco, no
          // ritmo do scroll; ao completar, um contorno fino marca o disco
          ilustracao: function () {
            var pulsou = false;
            gsap.fromTo(
              ilustracao,
              { clipPath: function () { return circulo(ilustracao, 0); } },
              {
                clipPath: function () { return circulo(ilustracao, "todo"); },
                ease: "none",
                scrollTrigger: faixaIlustracao({
                  onUpdate: function (st) {
                    if (!pulsou && st.progress > 0.98) {
                      pulsou = true;
                      anel(ilustracao, 0.85, 1.12);
                    }
                  },
                }),
              }
            );
          },
          // cartões: o mesmo sentido do Fio, num ritmo mais curto
          cartaoInicial: { opacity: 0, x: -12 * k },
          cartao: function (tl, cartao, inicio) {
            tl.to(cartao, { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" }, inicio);
          },
          passoCartoes: 0.08,
          // ícones abrem em círculo; depois título e descrição
          difInicial: function (p) {
            gsap.set(p.icone, { clipPath: "circle(0% at 50% 50%)" });
            gsap.set([p.valor, p.texto], { opacity: 0, y: 10 * k });
          },
          dif: function (tl, p, inicio) {
            tl.to(p.icone, { clipPath: "circle(75% at 50% 50%)", duration: 0.6, ease: "power2.out" }, inicio);
            tl.to(p.valor, { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" }, inicio + 0.2);
            tl.to(p.texto, { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" }, inicio + 0.3);
          },
          passoDif: 0.14,
        },

        // ------------------------------------------------------------------
        // FUROS EM CONCRETO — profundidade e expansão circular
        // ------------------------------------------------------------------
        furos: {
          // a foto se abre a partir do ponto onde a broca entra: primeiro um
          // círculo pequeno (o furo), um instante, e então se expande
          hero: function (tl) {
            var f = foco(heroFoto);
            var pequeno = Math.min(heroFoto.clientWidth, heroFoto.clientHeight) * 0.09;
            tl.fromTo(heroFoto, { clipPath: circulo(heroFoto, 0) }, { clipPath: circulo(heroFoto, pequeno), duration: 0.55, ease: "power2.out" }, 0);
            tl.to(heroFoto, { clipPath: "circle(" + (f.alcance + 2) + "px at " + f.x + "px " + f.y + "px)", duration: 1.1, ease: "power2.inOut" }, 0.75);
            rotulo(tl, migalha, heroTraco, 1.2);
            var fim = linhas(tl, heroTitulo, 1.35, 0.14, 0.85);
            texto(tl, heroDescricao, fim - 0.3);
          },
          // a ilustração sobe um pouco, no ritmo do scroll; ao assentar, um
          // contorno marca o furo uma única vez
          ilustracao: function () {
            var pulsou = false;
            gsap.fromTo(
              ilustracao,
              { y: 48 * k, opacity: 0.3 },
              {
                y: 0,
                opacity: 1,
                ease: "none",
                scrollTrigger: faixaIlustracao({
                  onUpdate: function (st) {
                    if (!pulsou && st.progress > 0.98) {
                      pulsou = true;
                      anel(ilustracao, 0.7, 1.18);
                    }
                  },
                }),
              }
            );
          },
          // cada cartão por si: o ícone se abre em círculo; o texto sobe
          cartaoInicial: function (cartao) {
            var p = partesCartao(cartao);
            gsap.set(p.icone, { clipPath: "circle(0% at 50% 50%)" });
            gsap.set([p.titulo, p.texto], { opacity: 0, y: 12 * k });
          },
          cartao: function (tl, cartao, inicio) {
            var p = partesCartao(cartao);
            tl.to(p.icone, { clipPath: "circle(75% at 50% 50%)", duration: 0.6, ease: "power2.out" }, inicio);
            tl.to(p.titulo, { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" }, inicio + 0.15);
            tl.to(p.texto, { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" }, inicio + 0.25);
          },
          passoCartoes: 0.16,
          cartoesIndividuais: true,
          // primeiro os ícones, depois os títulos, por último as descrições
          difInicial: function (p) {
            gsap.set([p.icone, p.valor, p.texto], { opacity: 0, y: 10 * k });
          },
          diferenciais: function (tl, inicio) {
            var grupos = ["icone", "valor", "texto"];
            grupos.forEach(function (nome, g) {
              itensDif.forEach(function (item, i) {
                tl.to(partesDif(item)[nome], { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" }, inicio + g * 0.35 + i * 0.12);
              });
            });
          },
        },

        // ------------------------------------------------------------------
        // DEMOLIÇÃO CONTROLADA — estrutura, blocos e planejamento
        // ------------------------------------------------------------------
        demolicao: {
          // a foto é montada em três faixas verticais, em sequência; depois
          // DEMOLIÇÃO, CONTROLADA e o texto
          hero: function (tl) {
            var faixas = [0, 1, 2].map(function (i) {
              var faixa = temporario("sd-faixa", hero);
              gsap.set(faixa, {
                left: heroFoto.offsetLeft + (heroFoto.offsetWidth * i) / 3 - 1,
                width: heroFoto.offsetWidth / 3 + 2,
                top: heroFoto.offsetTop,
                height: heroFoto.offsetHeight,
                transformOrigin: "50% 100%",
              });
              return faixa;
            });
            gsap.set(heroFoto, { opacity: 1 });
            tl.to(faixas, { scaleY: 0, duration: 0.75, ease: "power3.inOut", stagger: 0.16 }, 0.05);
            rotulo(tl, migalha, heroTraco, 0.75);
            var fim = linhas(tl, heroTitulo, 0.9, 0.2, 0.8);
            texto(tl, heroDescricao, fim - 0.3);
          },
          // o texto entra de lado, o mínimo
          paragrafoDe: { x: -14 * k, y: 0 },
          // a ilustração sobe de baixo para cima, no ritmo do scroll
          ilustracao: function () {
            gsap.fromTo(
              ilustracao,
              { clipPath: "inset(100% 0% 0% 0%)" },
              {
                clipPath: "inset(0% 0% 0% 0%)",
                ease: "none",
                scrollTrigger: faixaIlustracao(),
              }
            );
          },
          cartaoInicial: { opacity: 0, y: 24 * k },
          cartao: function (tl, cartao, inicio) {
            tl.to(cartao, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, inicio);
          },
          passoCartoes: 0.14,
          cartoesIndividuais: true,
          // etapas no ritmo do scroll: cada cartão sobe na sua vez,
          // conforme a fila avança pela tela (reversível)
          cartoesNoScroll: desktop
            ? function () {
                var tl = gsap.timeline({
                  scrollTrigger: { trigger: apLista, start: "top 82%", end: "top 35%", scrub: 0.6 },
                });
                cartoes.forEach(function (cartao, i) {
                  tl.to(cartao, { opacity: 1, y: 0, duration: 0.9, ease: "power2.out" }, i * 1.0);
                });
              }
            : null,
          // máscaras retangulares: o ícone sobe por trás de um recorte, o
          // título se abre da esquerda, a descrição vem por último
          difInicial: function (p) {
            gsap.set(p.icone, { clipPath: "inset(100% 0% 0% 0%)" });
            gsap.set(p.valor, { clipPath: "inset(-20% 100% -20% 0%)" });
            gsap.set(p.texto, { opacity: 0, y: 8 * k });
          },
          dif: function (tl, p, inicio) {
            tl.to(p.icone, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.6, ease: "power3.inOut" }, inicio);
            tl.to(p.valor, { clipPath: "inset(-20% -2% -20% 0%)", duration: 0.7, ease: "power3.inOut" }, inicio + 0.25);
            tl.to(p.texto, { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" }, inicio + 0.5);
          },
          passoDif: 0.22,
        },
      };

      var id = identidades[servico] || identidades.fio;

      // contorno amarelo fino que aparece, cresce um pouco e some — uma vez
      function anel(img, de, ate) {
        var f = foco(img);
        var el = temporario("sd-anel", quadro);
        var raio = f.raio || 60;
        gsap.set(el, {
          left: img.offsetLeft + f.x - raio,
          top: img.offsetTop + f.y - raio,
          width: raio * 2,
          height: raio * 2,
          opacity: 0,
          scale: de,
        });
        gsap
          .timeline({
            onComplete: function () {
              el.remove();
            },
          })
          .to(el, { opacity: 1, scale: 1, duration: 0.45, ease: "power2.out" })
          .to(el, { opacity: 0, scale: ate, duration: 0.7, ease: "power2.in" }, 0.5);
      }

      // ======================================================================
      // 1. Abertura — o Hero de cada serviço
      // ======================================================================
      function abrir() {
        gsap.set([migalha, heroTraco, heroTitulo, heroDescricao], { opacity: 0 });
        var tl = gsap.timeline({
          onComplete: function () {
            juntar(heroTitulo);
            limpar([heroFoto, migalha, heroTraco, heroDescricao]);
            qa(".sd-faixa", hero).forEach(function (el) {
              el.remove();
            });
          },
        });
        id.hero(tl);
        liberarAbertura();
      }

      // ======================================================================
      // 2. A Técnica — título, texto e a ilustração no ritmo do scroll
      // ======================================================================
      if (!revelados.has("tecnica")) {
        gsap.set([tecRotulo, tecTitulo, tecParagrafo], { opacity: 0 });
        gsap.set(tecTraco, { scaleX: 0, transformOrigin: "0% 50%" });
      }
      // o gatilho é o próprio texto: em telas baixas o começo dele já
      // aparece na primeira tela e não pode esperar a seção alcançar 72%
      aoEntrar("tecnica", q(".sd-tecnica__texto", tecnica), "top 95%", function (atraso) {
        var tl = gsap.timeline({
          delay: atraso,
          onComplete: function () {
            juntar(tecTitulo);
            limpar([tecRotulo, tecTraco, tecParagrafo]);
          },
        });
        rotulo(tl, tecRotulo, tecTraco, 0);
        var fim = linhas(tl, tecTitulo, 0.2, 0.12, 0.8);
        texto(tl, tecParagrafo, fim - 0.35, id.paragrafoDe);
      });
      id.ilustracao();

      // ======================================================================
      // 3. Aplicações — cabeçalho compartilhado; os cartões, de cada serviço
      // ======================================================================
      function estadoCartao(cartao) {
        if (typeof id.cartaoInicial === "function") id.cartaoInicial(cartao);
        else gsap.set(cartao, id.cartaoInicial);
      }

      function limparCartao(cartao) {
        var p = partesCartao(cartao);
        limpar([cartao, p.icone, p.titulo, p.texto]);
      }

      if (!revelados.has("aplicacoes")) {
        gsap.set([apRotulo, apTitulo], { opacity: 0 });
        gsap.set(apTraco, { scaleX: 0, transformOrigin: "0% 50%" });
        cartoes.forEach(estadoCartao);
      }
      aoEntrar("aplicacoes", aplicacoes, desktop ? "top 75%" : "top 82%", function (atraso) {
        var tl = gsap.timeline({
          delay: atraso,
          onComplete: function () {
            juntar(apTitulo);
            limpar([apRotulo, apTraco]);
          },
        });
        rotulo(tl, apRotulo, apTraco, 0);
        linhas(tl, apTitulo, 0.2, 0.12, 0.8);
      });

      if (id.cartoesNoScroll) {
        // Demolição no desktop: a sequência acompanha o scroll
        id.cartoesNoScroll();
      } else if (desktop && !id.cartoesIndividuais) {
        // a fila inteira, da esquerda para a direita
        aoEntrar("cartoes", apLista, "top 82%", function (atraso) {
          var tl = gsap.timeline({
            delay: atraso + 0.35,
            onComplete: function () {
              cartoes.forEach(limparCartao);
            },
          });
          cartoes.forEach(function (cartao, i) {
            id.cartao(tl, cartao, i * id.passoCartoes);
          });
        });
      } else {
        // cada cartão quando chega à tela (e no mobile, sempre assim)
        cartoes.forEach(function (cartao, i) {
          aoEntrar(
            "cartao" + i,
            cartao,
            "top 88%",
            function (atraso) {
              var tl = gsap.timeline({
                delay: atraso,
                onComplete: function () {
                  limparCartao(cartao);
                },
              });
              id.cartao(tl, cartao, 0);
            },
            id.passoCartoes
          );
        });
      }

      // ======================================================================
      // 4. Diferenciais técnicos
      // ======================================================================
      function estadoDif(item) {
        id.difInicial(partesDif(item));
      }

      function limparDif() {
        itensDif.forEach(function (item) {
          var p = partesDif(item);
          limpar([p.icone, p.valor, p.texto]);
        });
        limpar(divisores);
      }

      // cada item de diferencial, isolado (usado no mobile e quando o serviço
      // não tem uma coreografia própria para a fila)
      var difItem =
        id.dif ||
        function (tl, p, inicio) {
          [p.icone, p.valor, p.texto].forEach(function (el, g) {
            tl.to(el, { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" }, inicio + g * 0.15);
          });
        };

      if (!revelados.has("diferenciais")) {
        gsap.set([difRotulo, difTitulo], { opacity: 0 });
        gsap.set(difTraco, { scaleX: 0, transformOrigin: "0% 50%" });
      }
      itensDif.forEach(function (item, i) {
        if (!revelados.has(desktop ? "diferenciais" : "dif" + i)) estadoDif(item);
      });
      // divisores: verticais no desktop (crescem do centro), horizontais no
      // mobile (se traçam do centro para os lados)
      divisores.forEach(function (divisor, i) {
        if (revelados.has(desktop ? "diferenciais" : "divisor" + i)) return;
        gsap.set(divisor, desktop ? { scaleY: 0, transformOrigin: "50% 50%" } : { scaleX: 0, transformOrigin: "50% 50%" });
      });

      aoEntrar("diferenciais", diferenciais, desktop ? "top 70%" : "top 82%", function (atraso) {
        var tl = gsap.timeline({
          delay: atraso,
          onComplete: function () {
            juntar(difTitulo);
            limpar([difRotulo, difTraco]);
            if (desktop) limparDif();
          },
        });
        rotulo(tl, difRotulo, difTraco, 0);
        linhas(tl, difTitulo, 0.2, 0.12, 0.8);
        if (!desktop) return; // no mobile os itens entram um a um, abaixo
        tl.to(divisores, { scaleY: 1, duration: 0.8, ease: "power2.inOut", stagger: 0.15 }, 0.5);
        if (id.diferenciais) {
          id.diferenciais(tl, 0.6);
        } else {
          itensDif.forEach(function (item, i) {
            difItem(tl, partesDif(item), 0.6 + i * (id.passoDif || 0.18));
          });
        }
      });

      if (!desktop) {
        itensDif.forEach(function (item, i) {
          aoEntrar("dif" + i, item, "top 85%", function (atraso) {
            var tl = gsap.timeline({
              delay: atraso,
              onComplete: function () {
                var p = partesDif(item);
                limpar([p.icone, p.valor, p.texto]);
              },
            });
            difItem(tl, partesDif(item), 0);
          });
        });
        divisores.forEach(function (divisor, i) {
          aoEntrar("divisor" + i, divisor, "top 90%", function (atraso) {
            gsap.to(divisor, {
              scaleX: 1,
              duration: 0.7,
              delay: atraso,
              ease: "power2.inOut",
              onComplete: function () {
                limpar([divisor]);
              },
            });
          });
        });
      }

      // ======================================================================
      // 5. CTA — a textura se abre, título, texto e o botão por último
      // ======================================================================
      var ctaTextura = q(".sd-cta__textura", cta);
      var ctaRotulo = q(".sd-cta__rotulo", cta);
      var ctaTitulo = q(".sd-cta__titulo", cta);
      var ctaDescricao = q(".sd-cta__descricao", cta);
      var ctaBotao = q(".sd-cta__botao", cta);

      if (!revelados.has("cta")) {
        gsap.set(ctaTextura, { clipPath: "inset(0% 100% 0% 0%)" });
        gsap.set([ctaRotulo, ctaTitulo, ctaDescricao, ctaBotao], { opacity: 0 });
      }
      aoEntrar("cta", cta, desktop ? "top 80%" : "top 85%", function (atraso) {
        var tl = gsap.timeline({
          delay: atraso,
          onComplete: function () {
            juntar(ctaTitulo);
            limpar([ctaTextura, ctaRotulo, ctaDescricao, ctaBotao]);
          },
        });
        tl.to(ctaTextura, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: "power2.inOut" }, 0);
        rotulo(tl, ctaRotulo, null, 0.4);
        var fim = linhas(tl, ctaTitulo, 0.5, 0.12, 0.8);
        texto(tl, ctaDescricao, fim - 0.4);
        texto(tl, ctaBotao, fim - 0.15, { y: 10 * k });
      });

      // ======================================================================
      // 6. Outros serviços — os cartões em sequência
      // ======================================================================
      var outrosRotulo = q(".sd-outros__rotulo", outros);
      var outrosCartoes = qa(".sd-outro", outros);

      if (!revelados.has("outros")) {
        gsap.set(outrosRotulo, { opacity: 0 });
        gsap.set(outrosCartoes, { opacity: 0, y: 14 * k });
      }
      aoEntrar("outros", outros, desktop ? "top 82%" : "top 88%", function (atraso) {
        var tl = gsap.timeline({
          delay: atraso,
          onComplete: function () {
            limpar([outrosRotulo].concat(outrosCartoes));
          },
        });
        rotulo(tl, outrosRotulo, null, 0);
        tl.to(outrosCartoes, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.12 }, 0.15);
      });

      // ======================================================================
      // 7. Rodapé — a mesma entrada discreta das outras páginas
      // ======================================================================
      var rodape = q(".rodape");
      var logo = q(".rodape__logo", rodape);
      var sobreTexto = q(".rodape__sobre", rodape);
      var colunasNav = [q(".rodape__coluna--navegacao", rodape), q(".rodape__coluna--servicos", rodape)];
      var contatos = [q(".rodape__coluna--contato", rodape), q(".rodape__sociais", rodape)];
      var copyright = q(".rodape__copyright", rodape);
      var rodapeRisco = q(".rodape__risco", rodape);
      var rodapeTextos = [sobreTexto].concat(colunasNav, contatos);

      if (rodape && !revelados.has("rodape")) {
        gsap.set(logo, { yPercent: 100, clipPath: "inset(0% 0% 100% 0%)" });
        gsap.set(rodapeTextos, { y: 12 * k, opacity: 0 });
        gsap.set(copyright, { y: 8 * k, opacity: 0 });
        gsap.set(rodapeRisco, { scaleX: 0, transformOrigin: "0% 50%" });
      }
      aoEntrar("rodape", rodape, "top 88%", function (atraso) {
        var tl = gsap.timeline({
          delay: atraso,
          defaults: { ease: "power2.out" },
          onComplete: function () {
            limpar([logo, copyright, rodapeRisco].concat(rodapeTextos));
          },
        });
        tl.to(logo, { yPercent: 0, clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "power3.out" }, 0);
        tl.to(sobreTexto, { y: 0, opacity: 1, duration: 0.9 }, 0.2);
        tl.to(colunasNav, { y: 0, opacity: 1, duration: 0.9, stagger: 0.1 }, 0.35);
        tl.to(contatos, { y: 0, opacity: 1, duration: 0.9, stagger: 0.1 }, 0.55);
        tl.to(copyright, { y: 0, opacity: 1, duration: 0.8 }, 0.8);
        tl.fromTo(rodapeRisco, { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: "power2.inOut" }, 0.9);
      });

      // ======================================================================
      // Abertura: espera as fontes (quebras de linha finais) e, chegando de
      // outra página, a transição terminar
      // ======================================================================
      if (raiz.classList.contains("abertura-animada")) {
        var espera = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
        var teto = new Promise(function (ok) {
          setTimeout(ok, 1500);
        });
        Promise.all([Promise.race([espera, teto]), window.gvtEntradaPronta]).then(
          noContexto(function () {
            try {
              if (raiz.classList.contains("abertura-animada")) abrir();
            } catch (erro) {
              liberarAbertura();
            }
          })
        );
      }

      // fotos e fontes carregadas mudam alturas: os gatilhos são medidos de novo
      if (document.readyState !== "complete") {
        addEventListener("load", function () {
          if (ativo) ScrollTrigger.refresh();
        }, { once: true });
      }
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
          if (ativo) ScrollTrigger.refresh();
        });
      }

      // trocar de faixa (resize, orientação) desfaz estados, gatilhos e os
      // elementos temporários; os títulos voltam ao HTML
      return function () {
        ativo = false;
        divisoes.slice().forEach(function (item) {
          juntar(item.titulo);
        });
        criados.forEach(function (el) {
          el.remove();
        });
        liberarAbertura();
      };
    }
  );
})();
