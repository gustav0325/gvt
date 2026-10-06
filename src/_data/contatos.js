// Contatos oficiais da GVT — fonte única para footer, menu mobile, Home e
// Contato. O link do WhatsApp abre a conversa com a mensagem já preenchida
// (o visitante só envia); para trocar a mensagem, basta editar o texto
// abaixo: o link é gerado a partir dele.

const numeroWhatsapp = "5511940063857";
const mensagemWhatsapp =
  "Olá! Vim pelo site da GVT Cortes e Furos e gostaria de solicitar um orçamento para meu projeto. Poderiam me ajudar?";

// codificação estrita: também ! ' ( ) * (que encodeURIComponent mantém)
function codificar(texto) {
  return encodeURIComponent(texto).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

module.exports = {
  email: "gvt@gvtcortesefuros.com.br",
  // com pontos de quebra para a coluna estreita do celular
  emailQuebravel: "gvt@<wbr>gvtcortesefuros<wbr>.com.br",
  emailLink: "mailto:gvt@gvtcortesefuros.com.br",
  telefone: "(11) 94006-3857",
  telefoneLink: "tel:+5511940063857",
  whatsappMensagem: mensagemWhatsapp,
  whatsapp: `https://wa.me/${numeroWhatsapp}?text=${codificar(mensagemWhatsapp)}`,
};
