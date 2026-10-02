// GVT Cortes e Furos — Serviços: título revelado pelo scroll + percurso
// horizontal pinado (GSAP + ScrollTrigger)
//
// Só no desktop. Em telas menores e com reduced-motion a seção fica como no
// HTML/CSS: os três serviços empilhados, sem animação.
//
// A seção é pinada uma única vez, e tudo corre numa timeline ligada ao scroll:
//
//   (antes do pin) o título começa a ser revelado quando a seção chega à tela
//   PIN ─┬─ 1. o título termina de se revelar: uma máscara única desce
//        │     pelo bloco inteiro, atravessando as linhas em sequência
//        ├─ 2. a composição sobe até a faixa dos serviços, 1px por 1px de
//        │     scroll — exatamente a sensação de continuar rolando
//        └─ 3. a faixa corre para a esquerda: furos → fio → disco, com uma
//              pausa em cada serviço
//   UNPIN → a página segue para Obras
//
// Um pin só, porque o ScrollTrigger não aninha pins, e porque é isso que liga
// as duas etapas: o título e a faixa são partes do mesmo painel "resumo".

(function () {
  "use strict";

  var secao = document.querySelector(".servicos");
  if (!secao || !window.gsap || !window.ScrollTrigger) return;

  var gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger);

  var track = secao.querySelector(".servicos__track");
  var titulo = secao.querySelector(".servicos__titulo");
  var slides = gsap.utils.toArray(".servicos__slide", secao);

  // --- Ritmo, em múltiplos da altura da tela ------------------------------
  var REVELAR_ANTES_DO_PIN = 0.5; // começa com o topo da seção a 50% da tela
  var REVELAR_NO_PIN = 1.25;      // e termina 1,25 tela depois do pin
  var PAUSA_TITULO = 0.15;        // título completo, parado, antes de subir
  var PAUSA_SERVICO = 0.5;        // cada serviço parado na tela
  // o deslocamento horizontal é 1:1 — cada px de scroll anda 1px na faixa

  // --- Fundo contínuo -----------------------------------------------------
  // Réplica do fundo de um painel sobre a altura da tela. Nos painéis de 653
  // inclui o espelho vertical que cobre o que sobra acima da faixa.
  function fundoDoPainel(slide) {
    var caixa = document.createElement("div");
    var resumo = slide.classList.contains("servicos__slide--resumo");
    caixa.className = "servicos__fundo-painel" + (resumo ? " servicos__fundo-painel--resumo" : "");

    var original = slide.querySelector(".servicos__fundo");
    var copia = original.cloneNode(false);
    copia.className = "servicos__fundo-copia";
    caixa.appendChild(copia);

    if (!resumo) {
      var espelho = original.cloneNode(false);
      espelho.className = "servicos__fundo-copia servicos__fundo-copia--espelho";
      caixa.appendChild(espelho);
    }
    return caixa;
  }

  function camada(slide, lado) {
    var el = document.createElement("div");
    el.className = "servicos__transicao-camada servicos__transicao-camada--" + lado;
    el.appendChild(fundoDoPainel(slide));
    return el;
  }

  // monta o que o modo horizontal acrescenta e devolve como desfazer
  function montarFundoContinuo() {
    var criados = [];

    // espelho acima de "fio" e "disco"
    slides.slice(1).forEach(function (slide) {
      var espelho = slide.querySelector(".servicos__fundo").cloneNode(false);
      espelho.className = "servicos__espelho-acima";
      slide.insertBefore(espelho, slide.firstChild);
      criados.push(espelho);
    });

    // zonas de transição entre os painéis
    for (var i = 0; i < slides.length - 1; i++) {
      var zona = document.createElement("div");
      zona.className = "servicos__transicao";
      zona.setAttribute("aria-hidden", "true");

      var mascara = document.createElement("div");
      mascara.className = "servicos__transicao-mascara";
      mascara.appendChild(camada(slides[i + 1], "entrada"));

      zona.appendChild(camada(slides[i], "saida"));
      zona.appendChild(mascara);
      track.insertBefore(zona, slides[i + 1]);
      criados.push(zona);
    }

    return function () {
      criados.forEach(function (el) {
        el.remove();
      });
    };
  }

  var mm = gsap.matchMedia();

  mm.add(
    "(min-width: 1024px) and (min-aspect-ratio: 6/5) and (prefers-reduced-motion: no-preference)",
    function () {
      secao.classList.add("servicos--horizontal");
      var desmontar = montarFundoContinuo();

      // fora da tela na horizontal, o lazy loading só buscaria as fotos de
      // "fio" e "disco" quando elas já estivessem entrando: pediria no meio
      // do percurso
      var preguicosas = gsap.utils.toArray("img[loading='lazy']", secao);
      preguicosas.forEach(function (img) {
        img.loading = "eager";
      });

      // Medidas fracionárias: offsetLeft/offsetHeight arredondam para inteiro,
      // e a zona de transição tem 32cqw (432,32px em 1366) — o track pararia
      // décimos de pixel antes de cada painel. Os rects são deslocados pelo
      // mesmo transform, então as diferenças entre eles não dependem dele.
      function altura(el) {
        return el.getBoundingClientRect().height;
      }
      function subida() {
        return altura(track) - altura(secao);
      }
      function inicioDoPainel(i) {
        return slides[i].getBoundingClientRect().left - slides[0].getBoundingClientRect().left;
      }

      function medidas() {
        var H = altura(secao);
        return {
          revelar: REVELAR_NO_PIN * H,
          pausaTitulo: PAUSA_TITULO * H,
          subida: subida(),
          pausa: PAUSA_SERVICO * H,
          // de um painel ao seguinte: largura do painel + zona de transição
          passo: inicioDoPainel(1),
        };
      }

      function total(m) {
        return m.revelar + m.pausaTitulo + m.subida + 3 * m.pausa + 2 * m.passo;
      }

      // As durações estão em px de scroll, então o pin dura exatamente a soma
      // delas e cada trecho anda na proporção certa. Os valores de x/y são
      // funções: num redimensionamento, o ScrollTrigger os recalcula.
      var m = medidas();
      var mestre = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: secao,
          pin: true,
          start: "top top",
          end: function () {
            return "+=" + total(medidas());
          },
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      mestre
        // 1. o título termina de se revelar (tween abaixo) e fica um instante
        .to({}, { duration: m.revelar + m.pausaTitulo })

        // 2. sobe até a faixa, linear como o próprio scroll
        .to(track, {
          y: function () {
            return -subida();
          },
          duration: m.subida,
        })
        // em telas altas a última linha do título ainda estaria no topo quando
        // Furos para, cortada pela navbar: ele some enquanto sai por baixo dela
        .to(titulo, { opacity: 0, duration: 0.3 * m.subida }, "-=" + 0.3 * m.subida)

        // 3. furos → fio → disco, desacelerando em cada um
        .to({}, { duration: m.pausa })
        .to(track, {
          x: function () {
            return -inicioDoPainel(1);
          },
          duration: m.passo,
          ease: "sine.inOut",
        })
        .to({}, { duration: m.pausa })
        .to(track, {
          x: function () {
            return -inicioDoPainel(2);
          },
          duration: m.passo,
          ease: "sine.inOut",
        })
        .to({}, { duration: m.pausa });

      // Revelação do título: começa antes do pin, com a seção entrando na
      // tela, e termina dentro dele. Reversível: subir o scroll esconde de
      // novo, na ordem inversa.
      gsap.fromTo(
        titulo,
        { "--progresso": 0 },
        {
          "--progresso": 1,
          ease: "none",
          scrollTrigger: {
            trigger: secao,
            start: "top " + (1 - REVELAR_ANTES_DO_PIN) * 100 + "%",
            end: function () {
              return mestre.scrollTrigger.start + REVELAR_NO_PIN * secao.offsetHeight;
            },
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        }
      );

      return function () {
        desmontar();
        preguicosas.forEach(function (img) {
          img.loading = "lazy";
        });
        secao.classList.remove("servicos--horizontal");
      };
    }
  );

  // --- Mobile (até 1023px) ---------------------------------------------------
  // Os quatro frames "Serviços Mobile" como uma seção só, pinada:
  //   título revelado pelo scroll (a mesma máscara do desktop) → a faixa corre
  //   na horizontal, Intro → Furos → Fio → Disco, com uma pausa em cada
  //   serviço → o pin solta e a página segue para Obras.
  // O fundo fica parado atrás da faixa (Intro e Furos dividem o amarelo) e
  // troca por crossfade para o concreto do Fio e do Disco durante as viagens.
  var MOBILE = {
    revelarAntes: 0.4, // a revelação começa com o topo da seção a 60% da tela
    revelar: 1.1,      // e termina 1,1 tela depois do pin
    pausaTitulo: 0.15,
    viagem: 0.9,       // cada passagem de um painel ao seguinte
    pausa: 0.5,        // cada serviço parado na tela
  };

  mm.add("(max-width: 1023px) and (prefers-reduced-motion: no-preference)", function () {
    secao.classList.add("servicos--mobile");

    var preguicosas = gsap.utils.toArray("img[loading='lazy']", secao);
    preguicosas.forEach(function (img) {
      img.loading = "eager";
    });

    var fundoFio = secao.querySelector(".servicos__fundo-mobile--fio");
    var fundoDisco = secao.querySelector(".servicos__fundo-mobile--disco");

    function altura() {
      return secao.getBoundingClientRect().height;
    }
    // largura de um painel (100vw), medida entre Fio e Disco
    function painel() {
      return slides[2].getBoundingClientRect().left - slides[1].getBoundingClientRect().left;
    }
    function total() {
      var H = altura();
      return H * (MOBILE.revelar + MOBILE.pausaTitulo + 3 * MOBILE.viagem + 3 * MOBILE.pausa);
    }

    var H = altura();
    var viagem = MOBILE.viagem * H;
    var pausa = MOBILE.pausa * H;

    var mestre = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        id: "servicos-mobile",
        trigger: secao,
        pin: true,
        start: "top top",
        end: function () {
          return "+=" + total();
        },
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    function ate(i) {
      return function () {
        return -i * painel();
      };
    }

    mestre
      // título se revelando (tween abaixo) e parado um instante
      .to({}, { duration: (MOBILE.revelar + MOBILE.pausaTitulo) * H })
      // Intro → Furos (mesmo fundo amarelo)
      .to(track, { x: ate(1), duration: viagem, ease: "sine.inOut" })
      .to({}, { duration: pausa })
      // Furos → Fio, o fundo passa ao concreto do Fio
      .to(track, { x: ate(2), duration: viagem, ease: "sine.inOut" })
      .to(fundoFio, { opacity: 1, duration: viagem, ease: "sine.inOut" }, "<")
      .to({}, { duration: pausa })
      // Fio → Disco
      .to(track, { x: ate(3), duration: viagem, ease: "sine.inOut" })
      .to(fundoDisco, { opacity: 1, duration: viagem, ease: "sine.inOut" }, "<")
      .to({}, { duration: pausa });

    // revelação do título, ligada ao scroll e reversível
    gsap.fromTo(
      titulo,
      { "--progresso": 0 },
      {
        "--progresso": 1,
        ease: "none",
        scrollTrigger: {
          // o menu mobile usa o fim desta revelação como destino de #servicos
          id: "servicos-titulo-mobile",
          trigger: secao,
          start: "top " + (1 - MOBILE.revelarAntes) * 100 + "%",
          end: function () {
            return mestre.scrollTrigger.start + MOBILE.revelar * altura();
          },
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      }
    );

    // Girar o celular no meio da seção muda a altura da tela e, com ela, o
    // comprimento do pin; a rolagem absoluta ficaria num ponto que já é outro
    // (em paisagem, depois do Disco). Quando a largura muda com o pin ativo,
    // a página volta ao mesmo ponto relativo do percurso.
    // O progresso é lido no primeiro resize, que chega antes do refresh (o
    // ScrollTrigger o adia; no refreshInit o pin já foi desfeito). Se a
    // largura mudou, é uma rotação: a página volta ao mesmo ponto relativo.
    // Mudanças só de altura (a barra do navegador) não mexem em nada.
    var largura = window.innerWidth; // a do último refresh
    var guardado = null;

    function aoRedimensionar() {
      var st = mestre.scrollTrigger;
      if (guardado === null && st && st.isActive) guardado = st.progress;
    }

    function depoisDoRefresh() {
      var girou = window.innerWidth !== largura;
      largura = window.innerWidth;
      if (guardado !== null && girou) {
        var st = mestre.scrollTrigger;
        window.scrollTo(0, st.start + guardado * (st.end - st.start));
      }
      guardado = null;
    }

    window.addEventListener("resize", aoRedimensionar);
    window.ScrollTrigger.addEventListener("refresh", depoisDoRefresh);

    return function () {
      window.removeEventListener("resize", aoRedimensionar);
      window.ScrollTrigger.removeEventListener("refresh", depoisDoRefresh);
      preguicosas.forEach(function (img) {
        img.loading = "lazy";
      });
      secao.classList.remove("servicos--mobile");
    };
  });
})();
