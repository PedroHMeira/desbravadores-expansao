// js/utils/sanitize.js
//
// Escapa texto vindo de dados do usuário (nome, descrição, mensagem, etc.)
// antes de inserir em innerHTML, para evitar XSS. Seguro tanto para texto
// quanto para valores dentro de atributos (src, alt, title, data-*), já que
// os atributos neste projeto são sempre delimitados por aspas duplas.
export function escapeHtml(value) {
    if (value === null || value === undefined) {
        return '';
    }
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
