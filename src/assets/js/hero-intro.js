// GVT Cortes e Furos — abertura animada da Home (GSAP)
//
// A fotografia do Hero já está lá, no tamanho e no enquadramento finais: não
// há expansão, máscara nem escala. Sobre ela a interface se organiza, numa
// única gsap.timeline(), com sobreposições entre as etapas:
//
//   1. a navbar desce suavemente até a posição final
//   2. o conteúdo principal entra da direita para a esquerda
//   3. indicadores, "cortes / furos / demolições" e "role para explorar"
//      sobem de baixo, com um stagger discreto
//
// No mobile (até 1023px) a sequência é outra, vertical e mais curta:
//   1. a barra aparece; logo e hambúrguer descem um pouco
//   2. selo, título, descrição e CTA sobem, um a um
//   3. os dois diferenciais, quase juntos
//   4. "role para explorar" e o microtexto inferior, bem discretos
//
// Só roda quando o script inline do <head> marcou o <html> com .hero-intro
// (Home, JS ativo, sem prefers-reduced-motion, sem #âncora na URL). Até lá o
// CSS mantém a navbar e esses conteúdos ocultos, sem piscar na posição final.
// No fim, clearProps devolve cada elemento ao CSS original.

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

  var principal = gsap.utils.toArray(
    hero.querySelectorAll(".hero__selo, .hero__titulo, .hero__descricao, .hero__cta")
  );
  // da esquerda para a direita, na ordem do DOM: 20+ anos, divisor, obras,
  // divisor, equipamentos; depois "cortes / furos / demolições", à esquerda
  var secundarios = gsap.utils.toArray(
    hero.querySelectorAll(".hero__indicador, .hero__divisor, .hero__atuacao")
  );
  // "role para explorar": mouse, texto e seta sobem juntos, como um só item
  var rolar = gsap.utils.toArray(
    hero.querySelectorAll(".hero__scroll-mouse, .hero__scroll-texto, .hero__scroll-seta")
  );

  var mobile = window.matchMedia("(max-width: 1023px)").matches;

  // no mobile, logo e hambúrguer se movem dentro da barra, que só aparece
  var cabecalho = gsap.utils.toArray(navbar.querySelectorAll(".navbar__logo, .navbar__menu-botao"));
  var indicadores = gsap.utils.toArray(hero.querySelectorAll(".hero__indicador, .hero__divisor"));
  var atuacao = hero.querySelector(".hero__atuacao");

  // Chegando de outra página por uma transição (transicao.js), a navbar já
  // está lá, persistente: ela fica de fora da entrada (logo e hambúrguer
  // também)
  var navbarFixa = raiz.classList.contains("via-transicao");

  var animados = (navbarFixa ? [] : [navbar]).concat(
    principal,
    secundarios,
    rolar,
    mobile && !navbarFixa ? cabecalho : []
  );

  var estreita = window.innerWidth < 768;
  var DESLOCAMENTO_X = estreita ? 40 : 70;
  var DESLOCAMENTO_Y = estreita ? 20 : 30;
  var STAGGER = 0.12;

  function terminar() {
    // mesma passada síncrona: a classe sai e os estilos inline também, então
    // o navegador recalcula uma vez só, já no estado final do CSS
    raiz.classList.remove("hero-intro");
    gsap.set(animados, { clearProps: "transform,opacity" });
    // o clearProps deixa style="" vazio; sem ele o DOM volta a ser o original
    animados.forEach(function (el) {
      if (!el.getAttribute("style")) el.removeAttribute("style");
    });
  }

  function montar() {
    // a navbar sai de ~60% da própria altura acima da posição final
    var subidaNavbar = navbar.getBoundingClientRect().height * 0.6;

    if (!navbarFixa) gsap.set(navbar, { y: -subidaNavbar, opacity: 0 });
    gsap.set(principal, { x: DESLOCAMENTO_X, opacity: 0 });
    gsap.set(secundarios.concat(rolar), { y: DESLOCAMENTO_Y, opacity: 0 });

    // power2.out: desaceleração longa e natural, sem a largada brusca do
    // power3/expo em durações longas
    var tl = gsap.timeline({ defaults: { ease: "power2.out" }, onComplete: terminar });

    // 1. navbar, cima → baixo
    if (!navbarFixa) tl.to(navbar, { y: 0, opacity: 1, duration: 1.6 }, 0);

    tl
      // 2. conteúdo principal, direita → esquerda, pouco depois da navbar
      .to(principal, { x: 0, opacity: 1, duration: 1.5, stagger: 0.08 }, 0.35)

      // 3. informações secundárias, baixo → cima, enquanto o conteúdo
      //    principal ainda desacelera
      .to(secundarios, { y: 0, opacity: 1, duration: 1.3, stagger: STAGGER }, 0.85)
      .to(rolar, { y: 0, opacity: 1, duration: 1.3 }, 0.85 + secundarios.length * STAGGER);
  }

  function montarMobile() {
    if (!navbarFixa) {
      gsap.set(navbar, { opacity: 0 });
      gsap.set(cabecalho, { y: -14, opacity: 0 });
    }
    gsap.set(principal, { y: 22, opacity: 0 });
    gsap.set(indicadores, { y: 16, opacity: 0 });
    gsap.set(rolar.concat(atuacao), { y: 10, opacity: 0 });

    var tl = gsap.timeline({ defaults: { ease: "power2.out" }, onComplete: terminar });

    // 1. a barra aparece no lugar; logo e hambúrguer descem até ela
    if (!navbarFixa) {
      tl.to(navbar, { opacity: 1, duration: 0.9, ease: "power1.out" }, 0);
      tl.to(cabecalho, { y: 0, opacity: 1, duration: 1.1, stagger: 0.08 }, 0.1);
    }

    tl
      // 2. conteúdo principal, de baixo para cima, um elemento por vez
      .to(principal, { y: 0, opacity: 1, duration: 1.2, stagger: 0.12 }, 0.35)

      // 3. os dois diferenciais (e o divisor entre eles), quase juntos
      .to(indicadores, { y: 0, opacity: 1, duration: 1.1, stagger: 0.06 }, 1.0)

      // 4. o que fica embaixo, por último e sem pressa
      .to(rolar, { y: 0, opacity: 1, duration: 1.2 }, 1.35)
      .to(atuacao, { y: 0, opacity: 1, duration: 1.2 }, 1.45);
  }

  // Só espera as fontes, para os textos não trocarem de fonte no meio da
  // entrada. A foto não é esperada: ela aparece assim que carrega, como hoje.
  // Teto de 1,5s: com rede lenta a entrada segue assim mesmo.
  function fontesProntas() {
    var espera = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    var teto = new Promise(function (ok) {
      gsap.delayedCall(1.5, ok);
    });
    // chegando de outra página, espera também o conteúdo assentar (transicao.js)
    return Promise.all([Promise.race([espera, teto]), window.gvtEntradaPronta]);
  }

  // qualquer falha libera a página no estado final, nunca a deixa oculta
  function iniciar() {
    try {
      if (mobile) montarMobile();
      else montar();
    } catch (erro) {
      terminar();
    }
  }

  fontesProntas().then(iniciar, iniciar);
})();
