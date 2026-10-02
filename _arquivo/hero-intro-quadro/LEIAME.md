# Abertura "quadro com zoom" da Hero (versão anterior, fora de uso)

Tela branca → foto + navbar surgem num quadro pequeno no centro → expandem
juntas → conteúdo entra da direita → indicadores → base sobe. Scroll travado
durante a abertura. Substituída pelo reveal por máscara (clip-path), que revela o Hero em vez de
ampliá-lo.

Para restaurar:
1. `hero-intro.js` → `src/assets/js/hero-intro.js`
2. `hero-intro.css` → no fim de `src/assets/css/hero.css`, no lugar do bloco atual
3. `head-inline.njk` → em `src/_includes/base.njk`, no lugar do script inline do `<head>`

Esta pasta fica fora de `src/`, então não entra no `_site`.
