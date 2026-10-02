// GVT Cortes e Furos — marcadores do mapa da seção Obras
//
// Os pontos vêm do HTML (src/_data/estadosComObras.json → obras.njk); aqui
// só a interação, sem dependências:
//
//   mouse     o ponto mais perto do cursor (até RAIO_MOUSE) fica ativo e
//             abre o popup; longe de todos, fecha
//   toque     tocar perto de um ponto (até RAIO_TOQUE) abre ou troca o
//             popup; tocar fora do mapa fecha
//   teclado   cada ponto é um <button>: o foco abre, Esc fecha
//
// A escolha é sempre pelo ponto MAIS PRÓXIMO, nunca pela caixa do botão:
// no Nordeste os pontos ficam a poucos pixels uns dos outros, e assim cada
// um tem a sua área (a metade do caminho até o vizinho), sem encobrir o
// outro.
//
// O popup é um só, position: fixed. Abrir é com o CSS (.is-aberto: fade,
// subida e escala a partir da seta). Com ele já aberto, trocar de estado
// não o fecha: a caixa desliza e se ajusta ao novo texto, a seta acompanha
// o ponto e o conteúdo novo assenta por cima (animações do próprio
// navegador, Web Animations).

(function () {
  "use strict";

  var mapa = document.querySelector(".obras__mapa");
  var camada = document.querySelector(".obras__pontos");
  var popup = document.querySelector(".obras__popup");
  if (!mapa || !camada || !popup) return;

  var pontos = Array.prototype.slice.call(camada.querySelectorAll(".obras__ponto"));
  var conteudo = popup.querySelector(".obras__popup-conteudo");
  var seta = popup.querySelector(".obras__popup-seta");
  var campoEstado = popup.querySelector(".obras__popup-estado");
  var campoNumero = popup.querySelector(".obras__popup-numero");
  var navbar = document.querySelector(".navbar");
  var reduzido = window.matchMedia("(prefers-reduced-motion: reduce)");

  var RAIO_MOUSE = 16;
  var RAIO_TOQUE = 26;
  var BORDA = 12; // do popup às laterais da tela
  var VAO = 15; // do ponto até a caixa: a seta (7) e um respiro
  var SETA_MIN = 16; // a seta não encosta nos cantos arredondados
  var TROCA = { duration: 260, easing: "cubic-bezier(0.215, 0.61, 0.355, 1)" };

  var ativo = null;
  var origem = null; // "mouse" | "toque" | "foco"
  var fecharDepois = 0;
  var animacoes = [];

  function centro(ponto) {
    var r = ponto.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function maisProximo(x, y, raio) {
    var melhor = null;
    var limite = raio * raio;
    pontos.forEach(function (ponto) {
      var c = centro(ponto);
      var d = (c.x - x) * (c.x - x) + (c.y - y) * (c.y - y);
      if (d < limite) {
        limite = d;
        melhor = ponto;
      }
    });
    return melhor;
  }

  // durante a entrada da seção o mapa ainda está transparente
  function mapaVisivel() {
    return parseFloat(getComputedStyle(mapa).opacity) > 0.6;
  }

  function topoUtil() {
    return navbar ? Math.max(0, navbar.getBoundingClientRect().bottom) : 0;
  }

  function pararAnimacoes() {
    animacoes.forEach(function (a) {
      a.cancel();
    });
    animacoes = [];
  }

  // Posição do popup para o ponto ativo, com o tamanho natural do conteúdo
  // atual: acima do ponto (abaixo só se não couber), dentro das laterais.
  // Devolve false se o ponto saiu da área visível.
  function posicionar() {
    if (!ativo) return false;
    var c = centro(ativo);
    var largura = document.documentElement.clientWidth;
    var altura = window.innerHeight;
    var topo = topoUtil();

    if (c.y < topo || c.y > altura || c.x < 0 || c.x > largura) return false;

    var w = popup.offsetWidth;
    var h = popup.offsetHeight;
    var raioPonto = ativo.offsetWidth * 0.65; // já com a escala do ativo

    var acima = c.y - raioPonto - VAO - h;
    var abaixo = c.y + raioPonto + VAO;
    var cabeAcima = acima >= topo + 8;
    var cabeAbaixo = abaixo + h <= altura - 8;
    var emCima = cabeAcima || !cabeAbaixo;

    var x = Math.round(Math.min(Math.max(c.x - w / 2, BORDA), largura - w - BORDA));
    var setaX = Math.round(Math.min(Math.max(c.x - x, SETA_MIN), w - SETA_MIN));

    popup.style.left = x + "px";
    popup.style.top = Math.round(emCima ? acima : abaixo) + "px";
    popup.style.setProperty("--seta-x", setaX + "px");
    // a entrada vem do lado do ponto
    popup.style.setProperty("--desloc", emCima ? "10px" : "-10px");
    popup.classList.toggle("obras__popup--abaixo", !emCima);
    return true;
  }

  function preencher(ponto) {
    campoEstado.textContent = ponto.dataset.nome + " (" + ponto.dataset.sigla + ")";
    campoNumero.textContent = ponto.dataset.obras;
  }

  function abrir(ponto, de) {
    if (!ponto || !mapaVisivel()) return;
    clearTimeout(fecharDepois);
    origem = de;

    var aberto = popup.classList.contains("is-aberto");
    if (ponto === ativo && aberto) return;

    if (ativo) ativo.classList.remove("is-ativo");
    var anterior = aberto ? popup.getBoundingClientRect() : null;
    var setaAntes = aberto ? seta.getBoundingClientRect() : null;
    ativo = ponto;
    ativo.classList.add("is-ativo");

    pararAnimacoes();
    preencher(ponto);
    if (!posicionar()) {
      fechar();
      return;
    }

    if (!aberto) {
      // o deslocamento inicial (--desloc) precisa valer antes da transição
      void popup.offsetWidth;
      popup.classList.add("is-aberto");
      return;
    }

    // troca com o popup aberto: da caixa antiga para a nova, sem fechar
    if (reduzido.matches) return;
    var novo = popup.getBoundingClientRect();
    var setaX = parseFloat(popup.style.getPropertyValue("--seta-x"));
    var setaDe = setaAntes.left + setaAntes.width / 2 - anterior.left;
    animacoes = [
      popup.animate(
        [
          { left: anterior.left + "px", top: anterior.top + "px", width: anterior.width + "px", height: anterior.height + "px" },
          { left: novo.left + "px", top: novo.top + "px", width: novo.width + "px", height: novo.height + "px" },
        ],
        TROCA
      ),
      seta.animate([{ left: setaDe + "px" }, { left: setaX + "px" }], TROCA),
      conteudo.animate(
        [
          { opacity: 0.4, transform: "translateY(3px)" },
          { opacity: 1, transform: "none" },
        ],
        { duration: 220, easing: TROCA.easing }
      ),
    ];
  }

  function fechar() {
    clearTimeout(fecharDepois);
    pararAnimacoes();
    popup.classList.remove("is-aberto");
    if (ativo) ativo.classList.remove("is-ativo");
    ativo = null;
    origem = null;
    camada.style.cursor = "";
  }

  // pequena tolerância ao sair: o cursor que cruza o vão entre dois pontos
  // não faz o popup piscar
  function agendarFechar() {
    clearTimeout(fecharDepois);
    fecharDepois = setTimeout(fechar, 90);
  }

  // --- mouse --------------------------------------------------------------
  camada.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse") return;
    var ponto = maisProximo(e.clientX, e.clientY, RAIO_MOUSE);
    camada.style.cursor = ponto ? "pointer" : "";
    if (ponto) abrir(ponto, "mouse");
    else if (origem === "mouse") agendarFechar();
  });

  camada.addEventListener("pointerleave", function (e) {
    if (e.pointerType !== "mouse") return;
    camada.style.cursor = "";
    if (origem === "mouse") agendarFechar();
  });

  // --- toque (e clique) ---------------------------------------------------
  camada.addEventListener("click", function (e) {
    // Enter/Espaço no botão focado: o próprio botão
    if (e.detail === 0) {
      var botao = e.target.closest(".obras__ponto");
      if (botao) abrir(botao, "foco");
      return;
    }
    var ponto = maisProximo(e.clientX, e.clientY, RAIO_TOQUE);
    if (ponto) abrir(ponto, e.pointerType === "mouse" ? "mouse" : "toque");
    else if (origem !== "mouse") fechar();
  });

  // tocar (ou clicar) fora do mapa fecha
  document.addEventListener("pointerdown", function (e) {
    if (ativo && !camada.contains(e.target)) fechar();
  });

  // --- teclado ------------------------------------------------------------
  pontos.forEach(function (ponto) {
    ponto.addEventListener("focus", function () {
      if (ponto.matches(":focus-visible")) abrir(ponto, "foco");
    });
    ponto.addEventListener("blur", function () {
      if (origem === "foco" && !camada.contains(document.activeElement)) fechar();
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && ativo) fechar();
  });

  // --- rolagem e redimensionamento -----------------------------------------
  // com o mouse parado, a rolagem tira o ponto de baixo do cursor: fecha;
  // aberto por toque ou foco, o popup acompanha o ponto
  var quadro = 0;
  function acompanhar() {
    if (!ativo) return;
    if (origem === "mouse") {
      fechar();
      return;
    }
    cancelAnimationFrame(quadro);
    quadro = requestAnimationFrame(function () {
      pararAnimacoes();
      if (!posicionar()) fechar();
    });
  }

  window.addEventListener("scroll", acompanhar, { passive: true });
  window.addEventListener("resize", acompanhar);
})();
