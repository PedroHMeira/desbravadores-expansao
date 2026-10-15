// js/apiClient.js

const API_BASE_URL = window.API_BASE_URL || 'http://localhost:8080';

/**
 * Função global para fazer requisições autenticadas à API.
 * @param {string} endpoint O endpoint da API (ex: '/api/user/profile')
 * @param {object} options Opções de fetch (method, headers, body, etc.)
 * @returns {Promise<any>} A resposta da API em JSON.
 */
async function fetchApi(endpoint, options = {}) {
    const token = localStorage.getItem('jwtToken');
    
    // Configuração dos cabeçalhos padrão
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers, 
    };
    
    // TRATAMENTO PARA FormData (FileUpload)
    if (options.body instanceof FormData) {
        // Remove 'Content-Type': 'application/json' se o corpo for FormData
        delete headers['Content-Type'];
    }

    // Adiciona o token de autorização se existir
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers: headers,
        mode: options.mode || 'cors', 
    };

    const url = `${API_BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, config);

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('jwtToken');
            window.location.href = 'login.html';
            throw new Error('Sessão expirada ou acesso negado. Redirecionando para o login.');
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Erro na requisição: Status ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return response.json();
        }
        return null; 

    } catch (error) {
        console.error("Erro na chamada da API:", error);
        throw error;
    }
}
// Torna fetchApi global para ser acessível em todos os módulos e scripts
window.fetchApi = fetchApi;