// GVT Cortes e Furos — transição entre páginas
//
// O site é multipágina (Eleventy): cada página é um documento. A transição
// é quase imperceptível e só mexe no conteúdo (<main> e rodapé) — a navbar
// fica fixa e estável:
//
//   1. clique num link interno: o conteúdo some (opacity 1 → 0) subindo
//      poucos pixels, em 240ms, sobre o fundo já no tom do topo da página
//      de destino; se o tema da navbar muda, o vidro acompanha esse fade;
//   2. invisível: o item ativo passa ao destino (direto) e a navegação
//      acontece. A página nova nasce no
//      topo, com o conteúdo invisível (classe posta pelo <head>) e a navbar
//      já certa (vem do HTML);
//   3. o conteúdo novo assenta: opacity 0 → 1, vindo de poucos pixels
//      abaixo, em 360ms — disparado no fim do <body> (base.njk), já no
//      primeiro frame. Só então a abertura da página começa: as aberturas
//      esperam window.gvtEntradaPronta, junto com as fontes.
//
// Fica de fora: links externos, mailto/tel, nova aba, downloads, âncoras da
// mesma página, cliques com modificadores e prefers-reduced-motion (aí a
// navegação é a comum, e a navbar já nasce certa). O link da página atual
// não refaz a página: só volta ao topo.

(function () {
  "use strict";

  var raiz = document.documentElement;

  // desarma a trava do <head> (que mostra a página se este script faltar)
  window.__gvtTransicao = true;

  // as aberturas das páginas esperam esta promessa: ela se resolve quando o
  // conteúdo novo termina de assentar — ou na hora, sem transição
  var entradaPronta;
  window.gvtEntradaPronta = new Promise(function (ok) {
    entradaPronta = ok;
  });

  var CHAVE = "gvt-transicao";
  var SAIDA = { duration: 240, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" };
  var reduzir = window.matchMedia("(prefers-reduced-motion: reduce)");
  var estreita = window.matchMedia("(max-width: 1023px)");
  var emTransicao = false;

  var navbar = document.querySelector(".navbar");
  var partes = [document.querySelector(".site-main"), document.querySelector(".rodape")].filter(Boolean);

  // tema da navbar e tom do topo de cada página (gerado no base.njk)
  var paginas = {};
  try {
    paginas = JSON.parse(document.getElementById("gvt-paginas").textContent);
  } catch (erro) {
    // sem o mapa, o fundo e a navbar só mudam com a página nova
  }

  // "/obras" e "/obras/index.html" são a mesma página que "/obras/"
  function normalizar(caminho) {
    return caminho.replace(/index\.html?$/i, "").replace(/\/?$/, "/");
  }

  // link para outra página do site
  function destino(a, e) {
    if (!a || (e && (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey))) {
      return null;
    }
    if ((a.target && a.target !== "_self") || a.hasAttribute("download")) return null;
    var url;
    try {
      url = new URL(a.href, location.href);
    } catch (erro) {
      return null;
    }
    if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return null;
    // arquivos (pdf, imagens…) seguem normais
    if (/\.[a-z0-9]+$/i.test(url.pathname) && !/\.html?$/i.test(url.pathname)) return null;
    return url;
  }

  // ==========================================================================
  // Chegada: o conteúdo já está assentando (disparado no fim do <body>);
  // aqui só se espera o fim para liberar a abertura da página
  // ==========================================================================
  var entrada = window.__gvtEntrada;
  if (entrada && entrada.playState !== "finished") {
    emTransicao = true;
    var liberado = false;
    var liberar = function () {
      if (liberado) return;
      liberado = true;
      raiz.classList.remove("pagina-chegada");
      emTransicao = false;
      // o conteúdo estava deslocado enquanto os gatilhos de rolagem foram
      // medidos: mede de novo, já na posição final
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      entradaPronta();
    };
    entrada.addEventListener("finish", liberar);
    entrada.addEventListener("cancel", liberar);
    setTimeout(liberar, 1500); // trava
  } else {
    raiz.classList.remove("pagina-chegada");
    entradaPronta();
  }

  // ==========================================================================
  // Saída
  // ==========================================================================
  var links = navbar ? navbar.querySelectorAll(".nav__link") : [];
  var original = navbar
    ? {
        claro: navbar.classList.contains("navbar--claro"),
        escuro: navbar.classList.contains("navbar--escuro"),
        ativos: Array.prototype.map.call(links, function (link) {
          return link.classList.contains("nav__link--active");
        }),
      }
    : null;

  // Tema da navbar no do destino. Quando muda (ex.: Contato, claro → Home,
  // escuro), o vidro acompanha o próprio fade do conteúdo, com a mesma
  // duração: os dois terminam juntos, no instante em que o conteúdo some,
  // e os links nunca ficam escuros sobre o fundo já escuro (ou o contrário).
  function temaDoDestino(pagina) {
    if (!navbar || !pagina) return;
    var claro = pagina.nav === "claro";
    var escuro = pagina.nav === "escuro";
    if (navbar.classList.contains("navbar--claro") === claro && navbar.classList.contains("navbar--escuro") === escuro) {
      return;
    }
    navbar.style.setProperty("--vidro-tempo", SAIDA.duration + "ms");
    navbar.classList.toggle("navbar--claro", claro);
    navbar.classList.toggle("navbar--escuro", escuro);
  }

  // item ativo no destino, direto (sem o crossfade dos links)
  function ativoDoDestino(url) {
    if (!navbar) return;
    navbar.classList.add("navbar--direta");
    var alvo = normalizar(url.pathname);
    var algum = Array.prototype.some.call(links, function (link) {
      return normalizar(link.pathname) === alvo;
    });
    if (!algum) return;
    Array.prototype.forEach.call(links, function (link) {
      link.classList.toggle("nav__link--active", normalizar(link.pathname) === alvo);
    });
  }

  function sair(url) {
    emTransicao = true;
    try {
      sessionStorage.setItem(CHAVE, JSON.stringify({ para: normalizar(url.pathname), em: Date.now() }));
    } catch (erro) {
      // sem sessionStorage a página nova só não faz a entrada
    }

    // numa #âncora, o tema e o tom são os da seção (front matter ancoras);
    // âncora desconhecida: nada muda antes da página nova
    var pagina = url.hash ? paginas[normalizar(url.pathname) + url.hash] : paginas[normalizar(url.pathname)];
    var dy = estreita.matches ? 6 : 10;
    // com um trecho pinado na tela (Obras, Serviços da Home), um transform no
    // conteúdo deslocaria o que está fixo: aí só a opacidade
    var pinado =
      window.ScrollTrigger &&
      window.ScrollTrigger.getAll().some(function (gatilho) {
        return gatilho.pin && gatilho.isActive;
      });
    var quadros = pinado
      ? [{ opacity: 1 }, { opacity: 0 }]
      : [
          { opacity: 1, transform: "none" },
          { opacity: 0, transform: "translateY(-" + dy + "px)" },
        ];

    var animacoes = partes.map(function (el) {
      return el.animate(quadros, SAIDA);
    });
    // atrás do conteúdo, o fundo assume já o tom do topo do destino (antes
    // do fade ele está todo coberto): o conteúdo some sobre ele
    if (pagina && pagina.tom) {
      document.body.animate([{ backgroundColor: pagina.tom }, { backgroundColor: pagina.tom }], SAIDA);
    }
    temaDoDestino(pagina);

    animacoes[0].onfinish = function () {
      // conteúdo invisível: o deslocamento sai (o navegador guarda a rolagem
      // desta página para o "voltar" medindo os elementos — deslocados, ela
      // voltaria alguns pixels abaixo); só a opacidade 0 fica
      partes.forEach(function (el) {
        el.getAnimations().forEach(function (animacao) {
          animacao.cancel();
        });
        el.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 1000, fill: "forwards" });
      });
      // item ativo no destino e troca de página
      ativoDoDestino(url);
      location.assign(url.href);
      // se a navegação não acontecer (cancelada), nada fica escondido
      setTimeout(desfazer, 5000);
    };
  }

  function desfazer() {
    partes.concat(document.body).forEach(function (el) {
      el.getAnimations().forEach(function (animacao) {
        animacao.cancel();
      });
    });
    if (navbar && original) {
      navbar.classList.toggle("navbar--claro", original.claro);
      navbar.classList.toggle("navbar--escuro", original.escuro);
      Array.prototype.forEach.call(links, function (link, i) {
        link.classList.toggle("nav__link--active", original.ativos[i]);
      });
      navbar.classList.remove("navbar--direta");
      navbar.style.removeProperty("--vidro-tempo");
      if (!navbar.getAttribute("style")) navbar.removeAttribute("style");
    }
    raiz.classList.remove("pagina-chegada");
    emTransicao = false;
  }

  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    var url = destino(a, e);
    if (!url) return;

    if (normalizar(url.pathname) === normalizar(location.pathname)) {
      // âncora da mesma página: o comportamento de sempre
      if (url.hash) return;
      // a própria página: sem transição, só de volta ao topo
      e.preventDefault();
      if (!emTransicao) window.scrollTo({ top: 0, behavior: reduzir.matches ? "auto" : "smooth" });
      return;
    }

    if (reduzir.matches || !partes.length || !partes[0].animate) return; // navegação comum
    e.preventDefault();
    if (emTransicao) return; // uma transição por vez
    sair(url);
  });

  // Voltar pelo histórico pode reabrir esta página do cache (bfcache) no
  // estado em que saiu — invisível e com a navbar do destino: desfaz.
  addEventListener("pageshow", function (e) {
    if (e.persisted) desfazer();
  });

  // ==========================================================================
  // Pré-carregamento: ao apontar (ou focar, ou tocar) um link interno, o HTML
  // do destino já é buscado — a troca fica a mais curta possível
  // ==========================================================================
  var buscados = {};

  function preparar(e) {
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    var url = destino(a);
    if (!url) return;
    var caminho = normalizar(url.pathname);
    if (caminho === normalizar(location.pathname) || buscados[caminho]) return;
    buscados[caminho] = true;
    var link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url.origin + url.pathname;
    document.head.appendChild(link);
  }

  document.addEventListener("pointerover", preparar, { passive: true });
  document.addEventListener("touchstart", preparar, { passive: true });
  document.addEventListener("focusin", preparar);
})();
