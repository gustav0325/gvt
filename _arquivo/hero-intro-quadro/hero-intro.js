// GVT Cortes e Furos — abertura animada da Home (GSAP)
//
// Só roda quando o script inline do <head> marcou o <html> com .hero-intro
// (Home, JS ativo, sem prefers-reduced-motion, sem #âncora na URL). Até lá o
// CSS mantém a tela branca e tudo invisível, então não há flash do Hero pronto.
//
// Uma única gsap.timeline() conduz a sequência inteira:
//   tela branca → quadro (foto + navbar) surge pequeno no centro → expande até
//   a tela toda → conteúdo principal entra da direita → indicadores → base
//   sobe de baixo. No fim, clearProps devolve cada elemento ao CSS original e a
//   classe sai do <html>, liberando o scroll.

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

  // Foto e navbar formam o mesmo quadro: escalam com a mesma origem, o centro
  // da tela. Os dois começam no topo da página (scroll em 0), então essa
  // origem é 50% da largura e metade da altura da janela para ambos.
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
  var ESCALA_INICIAL = 0.42;
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
    gsap.set(animados, {
      clearProps: "transform,transformOrigin,opacity,willChange",
    });
    // o clearProps deixa style="" vazio; sem ele o DOM volta a ser o original
    animados.forEach(function (el) {
      if (!el.getAttribute("style")) el.removeAttribute("style");
    });
    removeEventListener("touchmove", bloquearToque);
    removeEventListener("resize", aoRedimensionar);
  }

  var tl = gsap.timeline({ paused: true, onComplete: terminar });

  // se a janela mudar de tamanho no meio, a origem calculada deixa de ser o
  // centro: pula direto para o estado final em vez de terminar torto
  function aoRedimensionar() {
    tl.progress(1);
  }

  function montar() {
    window.scrollTo(0, 0);

    var origem = "50% " + window.innerHeight / 2 + "px";

    gsap.set(quadro, {
      scale: ESCALA_INICIAL,
      transformOrigin: origem,
      opacity: 0,
      willChange: "transform, opacity",
    });
    gsap.set(principal, { x: DESLOCAMENTO_X, opacity: 0 });
    gsap.set(indicadores, { x: DESLOCAMENTO_X * 0.6, opacity: 0 });
    gsap.set(inferiores, { y: DESLOCAMENTO_Y, opacity: 0 });

    tl
      // 1–2. um instante de branco e o quadro surge pequeno, já com a navbar
      .to(quadro, { opacity: 1, duration: 0.35, ease: "power2.out" }, 0.15)

      // 3. expansão a partir do centro, desacelerando no tamanho final
      .to(quadro, { scale: 1, duration: 1.2, ease: "power3.inOut" }, "-=0.1")

      // 4. conteúdo principal, da direita para a esquerda, quando o quadro
      //    já está a menos de 0,5% da escala final
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

  // Espera a foto e as fontes para a expansão não começar com o quadro vazio
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
