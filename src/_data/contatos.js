// Contatos oficiais da GVT — fonte única para footer, menu mobile, Home,
// Contato, Sobre Nós e as páginas de serviço.
//
// WhatsApp: um único número e uma mensagem pré-preenchida por contexto (o
// visitante só envia). Para trocar uma mensagem, basta editar o texto em
// `mensagensWhatsapp`: os links são gerados a partir dele.
//   contatos.whatsapp            o link geral (mensagem "geral")
//   contatos.whatsappLinks.<id>  o link de um contexto: geral, sobre, fio,
//                                disco, furos, demolicao (os ids dos
//                                serviços são os do front matter `servico`)

const numeroWhatsapp = "5511940063857";

const mensagensWhatsapp = {
  geral: "Olá! Vim pelo site da GVT Cortes e Furos e gostaria de solicitar um orçamento. Poderia me ajudar?",
  sobre:
    "Olá! Conheci a GVT através do site e gostaria de conversar sobre um serviço e solicitar um orçamento. Poderia me ajudar?",
  fio: "Olá! Vim pelo site da GVT Cortes e Furos e gostaria de solicitar um orçamento para corte com fio diamantado. Poderia me ajudar?",
  disco:
    "Olá! Vim pelo site da GVT Cortes e Furos e gostaria de solicitar um orçamento para corte com disco diamantado. Poderia me ajudar?",
  furos: "Olá! Vim pelo site da GVT Cortes e Furos e gostaria de solicitar um orçamento para furo em concreto. Poderia me ajudar?",
  demolicao:
    "Olá! Vim pelo site da GVT Cortes e Furos e gostaria de solicitar um orçamento para demolição controlada. Poderia me ajudar?",
};

// codificação estrita: também ! ' ( ) * (que encodeURIComponent mantém)
function codificar(texto) {
  return encodeURIComponent(texto).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

function linkWhatsapp(mensagem) {
  return `https://wa.me/${numeroWhatsapp}?text=${codificar(mensagem)}`;
}

const whatsappLinks = {};
for (const [contexto, mensagem] of Object.entries(mensagensWhatsapp)) {
  whatsappLinks[contexto] = linkWhatsapp(mensagem);
}

// E-mail: `mailto:` universal (abre o app de e-mail padrão do aparelho —
// Gmail, Outlook, Apple Mail…), só com o assunto preenchido; o corpo fica
// livre para o visitante escrever
const email = "gvt@gvtcortesefuros.com.br";
const assuntoEmail = "Solicitação de orçamento";

module.exports = {
  email,
  // com pontos de quebra para a coluna estreita do celular
  emailQuebravel: "gvt@<wbr>gvtcortesefuros<wbr>.com.br",
  emailLink: `mailto:${email}?subject=${codificar(assuntoEmail)}`,
  telefone: "(11) 94006-3857",
  telefoneLink: "tel:+5511940063857",
  whatsappMensagens: mensagensWhatsapp,
  whatsappLinks,
  whatsapp: whatsappLinks.geral,
};
