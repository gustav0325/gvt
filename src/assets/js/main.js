// GVT Cortes e Furos
// A navbar é fixed e atravessa seções de fundos diferentes. Cada seção declara
// o tema que a barra deve assumir sobre ela (data-nav-tema="claro" ou
// "escuro"); sem declaração — o Hero — a barra fica como no Figma do Hero.
// Aqui só se troca a classe; a interpolação entre os estados (vidro claro ↔
// escuro, links, logo) é feita por CSS transitions em navbar.css.

(function () {
  "use strict";

  var navbar = document.querySelector(".navbar");
  if (!navbar) return;

  var secoes = document.querySelectorAll("[data-nav-tema]");
  if (!secoes.length) return;

  function alturaNavbar() {
    return navbar.getBoundingClientRect().height;
  }

  function atualizar() {
    var limite = alturaNavbar() / 2;
    var tema = null;

    for (var i = 0; i < secoes.length; i++) {
      var r = secoes[i].getBoundingClientRect();
      if (r.top <= limite && r.bottom > limite) {
        tema = secoes[i].getAttribute("data-nav-tema");
        break;
      }
    }

    navbar.classList.toggle("navbar--claro", tema === "claro");
    navbar.classList.toggle("navbar--escuro", tema === "escuro");
  }

  // Até a página terminar de carregar, os ajustes são diretos, sem a
  // interpolação do vidro: ela pode abrir no meio — numa #âncora, que o
  // navegador alcança durante o carregamento, ou pelo histórico — e o tema
  // acompanha a seção atrás da barra sem passar pelo cinza intermediário.
  // No topo ele já vem certo do HTML (navTema) e nada muda.
  navbar.classList.add("navbar--direta");
  // aberta numa #âncora de tema conhecido, a barra já nasceu certa (navbar.njk)
  // e o salto até a seção ainda não aconteceu: o primeiro ajuste fica para
  // a rolagem ou o load
  if (!document.documentElement.hasAttribute("data-nav-ancora")) atualizar();
  function liberarTransicao() {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        atualizar();
        navbar.classList.remove("navbar--direta");
      });
    });
  }
  if (document.readyState === "complete") liberarTransicao();
  else addEventListener("load", liberarTransicao, { once: true });
  addEventListener("scroll", atualizar, { passive: true });
  addEventListener("resize", atualizar);
})();

// Menu mobile (hambúrguer). A classe .menu-aberto no <html> abre o painel,
// transforma o hambúrguer em X e trava a rolagem — tudo em navbar.css.
(function () {
  "use strict";

  var botao = document.querySelector(".navbar__menu-botao");
  var menu = document.getElementById("menu-mobile");
  if (!botao || !menu) return;

  var raiz = document.documentElement;
  var links = menu.querySelectorAll("a");

  function definir(aberto) {
    raiz.classList.toggle("menu-aberto", aberto);
    botao.setAttribute("aria-expanded", aberto ? "true" : "false");
    botao.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
    // fechado, o menu sai da ordem de foco e da árvore de acessibilidade
    if (aberto) menu.removeAttribute("inert");
    else menu.setAttribute("inert", "");
  }

  botao.addEventListener("click", function () {
    var abrir = !raiz.classList.contains("menu-aberto");
    definir(abrir);
    if (abrir && links[0]) links[0].focus({ preventScroll: true });
  });

  // Onde o item leva. Em Serviços, com a animação mobile ativa, o destino é o
  // título já revelado (o fim da revelação, ver servicos.js), e não o topo da
  // seção com o título pela metade. Nas outras, o topo da seção menos o
  // scroll-margin-top (a altura da navbar), como numa âncora comum.
  function destino(alvo) {
    var titulo = window.ScrollTrigger && window.ScrollTrigger.getById("servicos-titulo-mobile");
    if (alvo.id === "servicos" && titulo) return titulo.end;
    var margem = parseFloat(getComputedStyle(alvo).scrollMarginTop) || 0;
    return Math.max(0, alvo.getBoundingClientRect().top + scrollY - margem);
  }

  // Escolher um item: o menu fecha (e a trava de rolagem sai junto). Os
  // itens levam às páginas (/sobre-nos/, /servicos/...): a navegação segue
  // normal, com a transição de transicao.js. Só um link com #seção da
  // própria página é trocado por uma rolagem suave até ela.
  for (var i = 0; i < links.length; i++) {
    links[i].addEventListener("click", function (e) {
      definir(false);

      var alvo = this.pathname === location.pathname && document.getElementById(this.hash.slice(1));
      if (!alvo) return;

      e.preventDefault();
      if (location.hash !== this.hash) history.pushState(null, "", this.hash);

      var reduzir = matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: destino(alvo), behavior: reduzir ? "auto" : "smooth" });

      // o foco segue para a seção (o link agora está num menu inerte)
      if (!alvo.hasAttribute("tabindex")) alvo.setAttribute("tabindex", "-1");
      alvo.focus({ preventScroll: true });
    });
  }

  addEventListener("keydown", function (e) {
    if (e.key === "Escape" && raiz.classList.contains("menu-aberto")) {
      definir(false);
      botao.focus();
    }
  });

  // se a janela passar para o desktop com o menu aberto, ele fecha
  var desktop = matchMedia("(min-width: 1024px)");
  var aoMudar = function (e) {
    if (e.matches) definir(false);
  };
  if (desktop.addEventListener) desktop.addEventListener("change", aoMudar);
  else desktop.addListener(aoMudar);
})();

// No iOS o :active só é aplicado a quem tem um ouvinte de toque; este, vazio e
// passivo, liga o retorno de toque dos botões (ver interacoes.css).
document.addEventListener("touchstart", function () {}, { passive: true });
