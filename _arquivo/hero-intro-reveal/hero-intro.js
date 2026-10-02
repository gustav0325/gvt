// GVT Cortes e Furos — abertura animada da Home (GSAP)
//
// Só roda quando o script inline do <head> marcou o <html> com .hero-intro
// (Home, JS ativo, sem prefers-reduced-motion, sem #âncora na URL). Até lá o
// CSS mantém a tela branca e tudo invisível, então não há flash do Hero pronto.
//
// Uma única gsap.timeline() conduz a sequência inteira:
//   tela branca → uma janela horizontal no centro revela parte do Hero → a
//   janela se abre até a tela toda, revelando também a navbar → conteúdo
//   principal entra da direita → indicadores → base sobe de baixo. No fim,
//   clearProps devolve cada elemento ao CSS original e a classe sai do <html>,
//   liberando o scroll.
//
// O efeito é de REVEAL, não de zoom: o Hero e a navbar ficam o tempo todo no
// tamanho e na posição finais, e só a área recortada (clip-path) cresce.

(function () {
  "use strict";

  var raiz = document.documentElement;
  if (!raiz.classList.contains("hero-intro")) return;

  // desarma a trava de segurança do <head>: daqui em diante a saída é nossa
  window.__gvtIntro = true;

  var hero = document.querySelector(".hero");
  var navbar = document.querySelector(".navbar");

  if (!window.gsap || !hero || !navbar) {
    raiz.classList.remove("hero-intro");
    return;
  }

  var gsap = window.gsap;

  // Foto e navbar formam o mesmo quadro: os dois recebem a mesma janela de
  // recorte, em coordenadas da tela. A navbar é fixed e fica fora do .hero,
  // por isso cada um tem o seu clip-path, animados no mesmo tempo e ease.
  var quadro = [hero, navbar];

  var principal = hero.querySelectorAll(
    ".hero__selo, .hero__titulo, .hero__descricao, .hero__cta"
  );
  // indicadores e divisores na ordem do DOM, da esquerda para a direita
  var indicadores = hero.querySelectorAll(".hero__indicador, .hero__divisor");
  var inferiores = hero.querySelectorAll(
    ".hero__atuacao, .hero__scroll-mouse, .hero__scroll-texto, .hero__scroll-seta"
  );

  var animados = quadro
    .concat(gsap.utils.toArray(principal))
    .concat(gsap.utils.toArray(indicadores))
    .concat(gsap.utils.toArray(inferiores));

  var estreita = window.innerWidth < 768;
  // janela inicial: horizontal (2,2 : 1), 44% da largura no desktop e 72% no
  // mobile, onde a tela em pé deixaria a janela alta demais; nunca passa de
  // 40% da altura
  var JANELA_LARGURA = estreita ? 0.72 : 0.44;
  var JANELA_PROPORCAO = 2.2;
  var JANELA_ALTURA_MAX = 0.4;
  var DESLOCAMENTO_X = estreita ? 48 : 80;
  var DESLOCAMENTO_Y = estreita ? 28 : 40;

  // no touch, overflow:hidden no <html> nem sempre segura o arrasto
  function bloquearToque(e) {
    e.preventDefault();
  }

  function terminar() {
    // mesma passada síncrona: a classe sai e os estilos inline também, então
    // o navegador recalcula uma vez só, já no estado final do CSS
    raiz.classList.remove("hero-intro");
    quadro.forEach(function (el) {
      el.style.webkitClipPath = el.style.clipPath = "";
    });
    gsap.set(animados, {
      clearProps: "transform,opacity,clipPath,willChange",
    });
    // o clearProps deixa style="" vazio; sem ele o DOM volta a ser o original
    animados.forEach(function (el) {
      if (!el.getAttribute("style")) el.removeAttribute("style");
    });
    removeEventListener("touchmove", bloquearToque);
    removeEventListener("resize", aoRedimensionar);
  }

  var tl = gsap.timeline({ paused: true, onComplete: terminar });
  var janela, aplicarJanela;

  // se a tela mudar de tamanho no meio, a janela calculada deixa de estar no
  // centro: pula direto para o estado final em vez de terminar torta
  function aoRedimensionar() {
    tl.progress(1);
  }

  function montar() {
    window.scrollTo(0, 0);

    // Hero começa no topo e ocupa a tela, então as coordenadas locais dele
    // são as da tela. W exclui a calha da barra de rolagem.
    var caixa = hero.getBoundingClientRect();
    var W = caixa.width;
    var H = caixa.height;
    var navAltura = navbar.getBoundingClientRect().height;

    var largura = W * JANELA_LARGURA;
    var altura = Math.min(largura / JANELA_PROPORCAO, H * JANELA_ALTURA_MAX);
    var lado = (W - largura) / 2;
    var topo = (H - altura) / 2;

    // 3 casas: evita notação científica (1e-5) no fim do tween
    function px(v) {
      return +v.toFixed(3) + "px";
    }
    function inset(t, r, b, l) {
      return "inset(" + px(t) + " " + px(r) + " " + px(b) + " " + px(l) + ")";
    }

    // Um único objeto guarda a janela, e cada quadro escreve o recorte nos
    // dois elementos a partir dele: Hero e navbar nunca se desalinham. (Não
    // dá para interpolar a string do clip-path: o navegador a guarda na forma
    // curta, "inset(369px 399px)", e o GSAP casaria os números errados.)
    // Na navbar, topo e laterais são iguais; a base é convertida para a caixa
    // dela e fica negativa, deixando o glow do item ativo aparecer abaixo da
    // barra como no layout final.
    janela = { t: topo, r: lado, b: topo, l: lado };
    aplicarJanela = function () {
      var h = inset(janela.t, janela.r, janela.b, janela.l);
      var n = inset(janela.t, janela.r, navAltura - H + janela.b, janela.l);
      hero.style.webkitClipPath = hero.style.clipPath = h;
      navbar.style.webkitClipPath = navbar.style.clipPath = n;
    };
    aplicarJanela();

    gsap.set(quadro, { opacity: 0, willChange: "clip-path" });
    gsap.set(principal, { x: DESLOCAMENTO_X, opacity: 0 });
    gsap.set(indicadores, { x: DESLOCAMENTO_X * 0.6, opacity: 0 });
    gsap.set(inferiores, { y: DESLOCAMENTO_Y, opacity: 0 });

    tl
      // 1–2. um instante de branco e a janela surge no centro
      .to(quadro, { opacity: 1, duration: 0.35, ease: "power2.out" }, 0.15)

      // 3. a janela se abre até a tela toda; a navbar entra no mesmo quadro
      //    quando a borda de cima chega a ela
      .to(
        janela,
        { t: 0, r: 0, b: 0, l: 0, duration: 1.4, ease: "power3.inOut", onUpdate: aplicarJanela },
        "-=0.1"
      )

      // 4. conteúdo principal, da direita para a esquerda, quando a janela
      //    já está praticamente aberta
      .to(
        principal,
        { x: 0, opacity: 1, duration: 0.75, ease: "power3.out", stagger: 0.07 },
        "-=0.12"
      )

      // 5. indicadores, colados no fim do bloco principal
      .to(
        indicadores,
        { x: 0, opacity: 1, duration: 0.65, ease: "power3.out", stagger: 0.06 },
        "-=0.5"
      )

      // 6. base do Hero, de baixo para cima, ainda durante os indicadores
      .to(
        inferiores,
        { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.07 },
        "-=0.5"
      );

    addEventListener("touchmove", bloquearToque, { passive: false });
    addEventListener("resize", aoRedimensionar);

    tl.play();
  }

  // Espera a foto e as fontes para a janela não se abrir sobre um quadro vazio
  // nem com o texto trocando de fonte no meio. Teto de 2,5s: com rede lenta
  // a abertura segue assim mesmo, em vez de prender a página no branco.
  function recursosProntos() {
    var foto = hero.querySelector(".hero__bg");
    var esperas = [];

    if (foto && !foto.complete) {
      esperas.push(
        new Promise(function (ok) {
          foto.addEventListener("load", ok, { once: true });
          foto.addEventListener("error", ok, { once: true });
        })
      );
    }
    if (document.fonts && document.fonts.ready) esperas.push(document.fonts.ready);

    var teto = new Promise(function (ok) {
      gsap.delayedCall(2.5, ok);
    });

    return Promise.race([Promise.all(esperas), teto]);
  }

  // qualquer falha libera a página no estado final, nunca a deixa no branco
  function iniciar() {
    try {
      montar();
    } catch (erro) {
      tl.kill();
      terminar();
    }
  }

  recursosProntos().then(iniciar, iniciar);
})();
