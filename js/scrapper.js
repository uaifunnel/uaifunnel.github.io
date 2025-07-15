// Variáveis globais
let allProfiles = [];
let originalProfiles = [];
let filteredProfiles = [];
let actionHistory = [];
let currentPage = 1;
let itemsPerPage = 50;
let isDarkMode = false;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
loadDarkModePreference();
loadSearchTemplates();
formatarDataAtual();
});

// Dark mode
function toggleDarkMode() {
isDarkMode = !isDarkMode;
document.body.classList.toggle('dark-mode', isDarkMode);
document.getElementById('darkModeToggle').textContent = isDarkMode ? '☀️' : '🌙';

try {
    localStorage.setItem('darkMode', isDarkMode);
} catch (e) {
    console.warn('Não foi possível salvar preferência de tema:', e);
}
}

function loadDarkModePreference() {
try {
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') {
    toggleDarkMode();
    }
} catch (e) {
    console.warn('Não foi possível carregar preferência de tema:', e);
}
}

// Mensagens
function showError(message) {
const errorDiv = document.getElementById('errorMessage');
errorDiv.textContent = message;
errorDiv.style.display = 'block';
setTimeout(() => {
    errorDiv.style.display = 'none';
}, 5000);
}

function showSuccess(message) {
const successDiv = document.getElementById('successMessage');
successDiv.textContent = message;
successDiv.style.display = 'block';
setTimeout(() => {
    successDiv.style.display = 'none';
}, 3000);
}

// Formatação de data
function formatarDataAtual() {
const agora = new Date();
const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho','Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const dataFormatada = diasSemana[agora.getDay()] + ', ' + agora.getDate() + ' de ' + meses[agora.getMonth()] + ' de ' + agora.getFullYear();
document.getElementById('datetime').textContent = dataFormatada;
}

// Validação de email
function validateEmail(email) {
const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
return re.test(email);
}

function improvedEmailRegex() {
return /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
}

// Pré-processamento do texto do Google
function preprocessGoogleResults(text) {
return text
    .replace(/site:instagram\.com[^"]*"[^"]*"/g, '') // Remover query de busca
    .replace(/Todas\nVídeos curtos\nImagens[^\n]*/g, '') // Remover menu do Google
    .replace(/SafeSearch\nDesativar\nBorrar\nFiltrar/g, '') // Remover controles
    .replace(/Mostrar mais imagens/g, '') // Remover links extras
    .replace(/Os resultados são personalizados[^]*$/g, '') // Remover footer
    .replace(/\n\s*\n\s*\n/g, '\n\n'); // Normalizar quebras de linha
}

// Extração avançada de emails
function extractEmailsAdvanced(text) {
const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const emails = text.match(emailRegex) || [];

return [...new Set(emails.filter(email => {
    return email.includes('@') && 
        email.includes('.') && 
        !email.startsWith('site:') &&
        email.length > 5 &&
        validateEmail(email);
}))];
}

// Extração avançada de telefones
function extractPhonesAdvanced(text) {
const phonePatterns = [
    /\+55\s?\(?\d{2}\)?\s?\d{4,5}[-.\s]?\d{4}/g,  // +55 (31) 99999-9999
    /\(?\d{2}\)?\s?\d{4,5}[-.\s]?\d{4}/g,         // (31) 99999-9999
    /\d{2}\s?\d{4,5}[-.\s]?\d{4}/g                // 31 99999-9999
];

const phones = new Set();

phonePatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    matches.forEach(phone => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length >= 10 && cleanPhone.length <= 13) {
        phones.add(phone.trim());
    }
    });
});

return Array.from(phones);
}

// Extração de usernames do Instagram
function extractInstagramUsername(text) {
const patterns = [
    /@([a-zA-Z0-9._-]+)/g,                    // @username
    /instagram\.com\/([a-zA-Z0-9._-]+)/g,     // URLs do Instagram
    /Instagram · ([a-zA-Z0-9._-]+)/g          // Formato "Instagram · username"
];

const usernames = new Set();

patterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
    const username = match[1];
    if (username && username.length > 2 && !username.includes('instagram')) {
        usernames.add(username);
    }
    }
});

return Array.from(usernames);
}

// Extrair número de seguidores
function extractFollowers(text) {
const followerMatch = text.match(/Mais de ([\d,\.]+) (?:mil )?seguidores/);
if (followerMatch) {
    let count = followerMatch[1].replace(/[,\.]/g, '');
    if (text.includes('mil seguidores')) {
    count = parseInt(count) * 1000;
    }
    return count.toLocaleString();
}
return '';
}

// Extrair localização
function extractLocation(text) {
const locationPatterns = [
    /Belo Horizonte[^,\n]*/gi,
    /BH[^,\n]*/gi,
    /Minas Gerais[^,\n]*/gi,
    /MG[^,\n]*/gi
];

for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match) {
    return match[0].trim();
    }
}
return '';
}

// Parsing Instagram completamente reformulado
function parseInstagramAdvanced(text) {
const results = [];

// Dividir por blocos mais inteligentemente
const blocks = text.split(/\n(?=\w+.*Instagram|@\w+|\w+.*\(\@\w+\))/);

blocks.forEach(block => {
    try {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 2) return;
    
    // Extrair username principal
    let username = '';
    let displayName = '';
    
    // Procurar padrões de username
    const usernamePatterns = [
        /^([a-zA-Z0-9._-]+)\s*\(\@([a-zA-Z0-9._-]+)\)/,  // "Nome (@username)"
        /Instagram · ([a-zA-Z0-9._-]+)/,                   // "Instagram · username"
        /@([a-zA-Z0-9._-]+)/                               // "@username"
    ];
    
    for (const pattern of usernamePatterns) {
        const match = block.match(pattern);
        if (match) {
        username = match[1] || match[2];
        if (pattern.source.includes('\\(@')) {
            displayName = match[1];
            username = match[2];
        }
        break;
        }
    }
    
    if (!username) return;
    
    // Extrair biografia (ignorar metadados)
    const bio = lines.find(line => 
        line.length > 30 && 
        !line.includes('seguidores') &&
        !line.includes('marcações') &&
        !line.includes('Instagram') &&
        !line.includes('@') &&
        !line.match(/^\d+:\d+$/) &&
        !line.includes('site:instagram.com')
    ) || '';
    
    // Extrair emails e telefones
    const emails = extractEmailsAdvanced(block);
    const phones = extractPhonesAdvanced(block);
    
    // Extrair informações específicas do Instagram
    const followers = extractFollowers(block);
    const location = extractLocation(block);
    
    const profile = {
        Nome: displayName || username,
        Username: username,
        Bio: bio,
        'E-mail': emails.join(', '),
        Telefone: phones.join(', '),
        Seguidores: followers,
        Localização: location,
        'Link do Perfil': `https://instagram.com/${username}`
    };
    
    // Aplicar sistema de qualidade
    const quality = addQualityIndicators(profile);
    profile.Qualidade = quality.qualityText;
    profile.Indicadores = quality.indicators;
    profile._qualityScore = quality.score;
    profile._qualityLevel = quality.quality;
    
    results.push(profile);
    
    } catch (error) {
    console.warn('Erro ao processar bloco:', error);
    }
});

return results;
}

// Extração de emails e telefones (funções compatíveis)
function extractEmails(text) {
return extractEmailsAdvanced(text);
}

function extractPhones(text) {
return extractPhonesAdvanced(text);
}

// Geração de link de perfil aprimorada
function generateProfileLink(name, platform) {
if (!name || typeof name !== 'string') return '';

const isUsername = name.includes('@') || name.includes('.') || name.match(/^[a-zA-Z0-9._-]+$/);

let cleanName;

if (isUsername) {
    cleanName = name.toLowerCase()
    .replace(/^@/, '')
    .replace(/[^\w.-]/g, '')
    .replace(/\.+/g, '.')
    .replace(/^\.+|\.+$/g, '');
} else {
    cleanName = name.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.+|\.+$/g, '');
}

const platforms = {
    'instagram': `https://instagram.com/${cleanName}`,
    'linkedin': `https://linkedin.com/in/${cleanName.replace(/\./g, '-')}`,
    'facebook': `https://facebook.com/${cleanName}`,
    'twitter': `https://twitter.com/${cleanName.replace(/\./g, '')}`,
    'tiktok': `https://tiktok.com/@${cleanName}`,
    'youtube': `https://youtube.com/@${cleanName}`
};

return platforms[platform] || '';
}

// Busca avançada com operadores melhorada
function buildAdvancedQuery() {
const site = document.getElementById('inputSite').value.trim();
const keyword = document.getElementById('inputProfession').value.trim();
const location = document.getElementById('inputCity').value.trim();
const emailType = document.getElementById('inputEmailType').value.trim();

if (!site || !keyword || !location) {
    throw new Error('Preencha Site, Palavra-chave e Localização.');
}

const excludeTerms = '-"fake" -"spam" -"bot" -"parody"';
const includeTerms = 'contato OR "entre em contato" OR "trabalho" OR "profissional"';

const queryParts = [
    `site:${site}`,
    `"${keyword}"`,
    `"${location}"`,
    emailType ? `"${emailType}"` : '',
    includeTerms,
    excludeTerms
].filter(Boolean);

return queryParts.join(' ');
}

// Preview da busca
function previewSearch() {
try {
    const query = buildAdvancedQuery();
    const preview = document.getElementById('searchPreview');
    preview.style.display = 'block';
    preview.innerHTML = `
    <strong>🔍 Busca que será executada:</strong><br>
    <code>${query}</code><br>
    <small class="text-muted">Dica: Esta busca irá procurar perfis com a palavra-chave especificada na localização desejada.</small>
    `;
} catch (error) {
    showError(error.message);
}
}

// Abrir busca no Google
function openSearch() {
try {
    const finalQuery = encodeURIComponent(buildAdvancedQuery());
    window.open(`https://www.google.com/search?q=${finalQuery}&num=100`, '_blank');
    showSuccess('Busca aberta em nova aba!');
} catch (error) {
    showError(error.message);
}
}

// Templates de busca
function saveSearchTemplate() {
const template = {
    site: document.getElementById('inputSite').value,
    keyword: document.getElementById('inputProfession').value,
    location: document.getElementById('inputCity').value,
    email: document.getElementById('inputEmailType').value,
    name: prompt('Nome para o template:')
};

if (!template.name) return;

try {
    const templates = JSON.parse(localStorage.getItem('searchTemplates') || '[]');
    templates.push(template);
    localStorage.setItem('searchTemplates', JSON.stringify(templates));
    showSuccess('Template salvo com sucesso!');
} catch (error) {
    showError('Erro ao salvar template.');
}
}

function loadSearchTemplates() {
try {
    const templates = JSON.parse(localStorage.getItem('searchTemplates') || '[]');
    // Implementar dropdown para carregar templates se necessário
} catch (error) {
    console.warn('Erro ao carregar templates:', error);
}
}

// Indicadores de qualidade aprimorados
function addQualityIndicators(profile) {
let score = 0;
let indicators = [];

const email = profile['E-mail'] || '';
if (email.trim() && validateEmail(email)) {
    score += 40;
    indicators.push('📧');
}

const telefone = profile.Telefone || '';
if (telefone.trim() && telefone.match(/\d{10,}/)) {
    score += 30;
    indicators.push('📱');
}

const bio = profile.Bio || '';
if (bio.trim() && bio.length > 20) {
    score += 20;
    indicators.push('📝');
}

const link = profile['Link do Perfil'] || profile['Perfil LinkedIn'] || '';
if (link.trim() && link.startsWith('http')) {
    score += 10;
    indicators.push('🔗');
}

const quality = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'basic';
const qualityText = score >= 70 ? 'Alta' : score >= 40 ? 'Média' : 'Básica';

return {
    score,
    indicators: indicators.join(' '),
    quality,
    qualityText
};
}

// Parsing melhorado do Instagram (função principal)
function parseInstagramImproved(text) {
// Pré-processar o texto
const cleanText = preprocessGoogleResults(text);

// Usar o parsing avançado
return parseInstagramAdvanced(cleanText);
}

// Parsing melhorado do LinkedIn
function parseLinkedInImproved(text) {
const blocks = text.split(/\n\s*\n/);
const results = [];

blocks.forEach(block => {
    try {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length === 0) return;
    
    const name = lines[0] || '';
    const cargo = lines[1] || '';
    const bio = lines.slice(2).find(l => l.length > 30) || '';
    const localizacao = lines.find(l => /(Belo Horizonte|MG|Brasil)/i.test(l)) || '';
    const emails = extractEmails(block);
    const phones = extractPhones(block);

    if (name && name.length > 2) {
        const profile = {
        Nome: name,
        Cargo: cargo,
        Bio: bio,
        Localização: localizacao,
        'E-mail': emails.join(', '),
        Telefone: phones.join(', '),
        'Link do Perfil': generateProfileLink(name, 'linkedin')
        };
        
        const quality = addQualityIndicators(profile);
        profile.Qualidade = quality.qualityText;
        profile.Indicadores = quality.indicators;
        profile._qualityScore = quality.score;
        profile._qualityLevel = quality.quality;
        
        results.push(profile);
    }
    } catch (error) {
    console.warn('Erro ao processar bloco LinkedIn:', error);
    }
});

return results;
}

// Validação de dados extraídos
function validateExtractedData(profiles) {
return profiles.filter(profile => {
    // Filtrar perfis com dados mínimos válidos
    return profile.Nome && 
        profile.Nome.length > 2 && 
        !profile.Nome.includes('gmail.com') &&
        !profile.Nome.includes('instagram') &&
        !profile.Nome.includes('Todas') &&
        !profile.Nome.match(/^\d+:\d+$/);
});
}

// Parsing principal com melhor tratamento de erros
function parseProfiles(text) {
if (!text || text.trim().length === 0) {
    throw new Error('Texto vazio ou inválido');
}

const site = document.getElementById('inputSite').value.toLowerCase();
let results = [];

try {
    if (site.includes('instagram')) {
    results = parseInstagramImproved(text);
    } else if (site.includes('linkedin')) {
    results = parseLinkedInImproved(text);
    } else {
    results = parseInstagramImproved(text);
    }
    
    // Validar dados extraídos
    results = validateExtractedData(results);
    
    if (results.length === 0) {
    throw new Error('Nenhum perfil válido encontrado no texto. Verifique o formato.');
    }
    
    return results.map(profile => {
    const quality = addQualityIndicators(profile);
    
    return {
        Nome: profile.Nome || '',
        Bio: profile.Bio || '',
        'E-mail': profile['E-mail'] || '',
        Telefone: profile.Telefone || '',
        'Link do Perfil': profile['Link do Perfil'] || profile['Perfil LinkedIn'] || '',
        Qualidade: quality.qualityText,
        Indicadores: quality.indicators,
        _qualityScore: quality.score,
        _qualityLevel: quality.quality
    };
    });
} catch (error) {
    console.error('Erro no parsing:', error);
    throw new Error('Erro ao processar perfis: ' + error.message);
}
}

// Remoção de duplicatas melhorada
function removeDuplicatesFromArray(profiles) {
const seen = new Map();

return profiles.filter(profile => {
    const name = profile.Nome.toLowerCase().trim();
    const email = (profile['E-mail'] || '').toLowerCase().trim();
    const phone = (profile.Telefone || '').replace(/\D/g, '');
    
    // Chave composta para detectar duplicatas
    const key = `${name}-${email}-${phone}`;
    
    if (seen.has(key)) {
    return false;
    }
    
    seen.set(key, true);
    return true;
});
}

// Histórico de ações
function saveAction(action, data) {
actionHistory.push({
    action,
    data: JSON.parse(JSON.stringify(data)),
    timestamp: Date.now()
});

// Manter apenas as últimas 10 ações
if (actionHistory.length > 10) {
    actionHistory.shift();
}

document.getElementById('undoBtn').disabled = false;
}

function undoLastAction() {
if (actionHistory.length === 0) return;

const lastAction = actionHistory.pop();
allProfiles = lastAction.data;

updateTable();
showStatistics(allProfiles);
showSuccess('Ação desfeita!');

if (actionHistory.length === 0) {
    document.getElementById('undoBtn').disabled = true;
}
}

// Função para remover duplicatas (botão)
function removeDuplicates() {
const originalCount = allProfiles.length;
saveAction('removeDuplicates', allProfiles);

allProfiles = removeDuplicatesFromArray(allProfiles);
const newCount = allProfiles.length;

if (originalCount > newCount) {
    showSuccess(`Removidas ${originalCount - newCount} duplicatas!`);
    updateTable();
    showStatistics(allProfiles);
} else {
    showSuccess('Nenhuma duplicata encontrada!');
}
}

// Paginação
function changePage(direction) {
const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);

if (direction === 1 && currentPage < totalPages) {
    currentPage++;
} else if (direction === -1 && currentPage > 1) {
    currentPage--;
}

updateTable();
updatePagination();
}

function changeItemsPerPage() {
itemsPerPage = parseInt(document.getElementById('itemsPerPage').value);
currentPage = 1;
updateTable();
updatePagination();
}

function updatePagination() {
const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);

document.getElementById('pageInfo').textContent = `Página ${currentPage} de ${totalPages}`;
document.getElementById('prevPage').disabled = currentPage === 1;
document.getElementById('nextPage').disabled = currentPage === totalPages;

if (totalPages > 1) {
    document.getElementById('paginationContainer').style.display = 'flex';
} else {
    document.getElementById('paginationContainer').style.display = 'none';
}
}

// Estatísticas
function showStatistics(profiles) {
const stats = {
    total: profiles.length,
    withEmail: profiles.filter(p => p['E-mail']).length,
    withPhone: profiles.filter(p => p.Telefone).length,
    highQuality: profiles.filter(p => p._qualityScore >= 70).length,
    mediumQuality: profiles.filter(p => p._qualityScore >= 40 && p._qualityScore < 70).length,
    basicQuality: profiles.filter(p => p._qualityScore < 40).length
};

const statsHtml = `
    <div class="row text-center mb-4">
    <div class="col-md-2">
        <div class="stat-card">
        <h4>${stats.total}</h4>
        <small>Total de Leads</small>
        </div>
    </div>
    <div class="col-md-2">
        <div class="stat-card">
        <h4>${stats.withEmail}</h4>
        <small>Com Email</small>
        </div>
    </div>
    <div class="col-md-2">
        <div class="stat-card">
        <h4>${stats.withPhone}</h4>
        <small>Com Telefone</small>
        </div>
    </div>
    <div class="col-md-2">
        <div class="stat-card">
        <h4>${stats.highQuality}</h4>
        <small>Alta Qualidade</small>
        </div>
    </div>
    <div class="col-md-2">
        <div class="stat-card">
        <h4>${stats.mediumQuality}</h4>
        <small>Média Qualidade</small>
        </div>
    </div>
    <div class="col-md-2">
        <div class="stat-card">
        <h4>${stats.basicQuality}</h4>
        <small>Básica</small>
        </div>
    </div>
    </div>
`;

document.getElementById('statsContainer').innerHTML = statsHtml;
}

// Atualização da barra de progresso
function updateProgress(percent) {
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const progressContainer = document.getElementById('progressContainer');

progressContainer.style.display = 'block';
progressBar.style.width = percent + '%';
progressText.textContent = `Processando... ${Math.round(percent)}%`;

if (percent >= 100) {
    setTimeout(() => {
    progressContainer.style.display = 'none';
    }, 1000);
}
}

// Processamento em lote
function processBatch(text, batchSize = 50) {
const blocks = text.split(/\n\s*\n/);
const results = [];

for (let i = 0; i < blocks.length; i += batchSize) {
    const batch = blocks.slice(i, i + batchSize);
    const batchText = batch.join('\n\n');
    
    try {
    const batchResults = parseProfiles(batchText);
    results.push(...batchResults);
    } catch (error) {
    console.warn('Erro no processamento do lote:', error);
    }
    
    updateProgress((i + batchSize) / blocks.length * 100);
}

return results;
}

// Highlight de texto
function escapeRegExp(string) {
return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightText(text, term) {
if (!term) return text;
const re = new RegExp(`(${escapeRegExp(term)})`, 'gi');
return text.replace(re, '<mark>$1</mark>');
}

// Construção da tabela
function buildTable(data, highlightTerm = '') {
if (data.length === 0) {
    return '<p class="text-center text-muted">Nenhum resultado encontrado.</p>';
}

const columnOrder = ['Nome', 'Bio', 'E-mail', 'Telefone', 'Link do Perfil', 'Qualidade', 'Indicadores'];
const allHeaders = Object.keys(data[0]).filter(h => !h.startsWith('_'));
const headers = [...columnOrder.filter(h => allHeaders.includes(h)), 
                ...allHeaders.filter(h => !columnOrder.includes(h))];

let html = '<div class="table-responsive"><table class="table table-striped table-hover"><thead><tr><th>#</th>';
headers.forEach(h => html += `<th>${h}</th>`);
html += '</tr></thead><tbody>';

// Paginação
const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;
const paginatedData = data.slice(startIndex, endIndex);

paginatedData.forEach((row, i) => {
    html += '<tr>';
    html += `<td>${startIndex + i + 1}</td>`;
    headers.forEach(h => {
    let cellContent = row[h] || '';
    
    if (h === 'Qualidade' && row._qualityLevel) {
        const qualityClass = `quality-${row._qualityLevel}`;
        cellContent = `<span class="quality-badge ${qualityClass}">${cellContent}</span>`;
    }
    
    if (h === 'Link do Perfil' && cellContent) {
        const platform = cellContent.includes('instagram') ? 'Instagram' : 
                        cellContent.includes('linkedin') ? 'LinkedIn' : 
                        cellContent.includes('facebook') ? 'Facebook' : 'Perfil';
        cellContent = `<a href="${cellContent}" target="_blank" rel="noopener" class="btn btn-sm btn-outline-primary">🔗 ${platform}</a>`;
    }
    
    html += `<td>${highlightText(cellContent, highlightTerm)}</td>`;
    });
    html += '</tr>';
});

html += '</tbody></table></div>';
return html;
}

// Atualizar tabela
function updateTable() {
const filterTerm = document.getElementById('filterInput').value;
const qualityFilter = document.getElementById('qualityFilter').value;

filteredProfiles = allProfiles.filter(profile => {
    const matchesText = Object.values(profile).join(' ').toLowerCase().includes(filterTerm.toLowerCase());
    const matchesQuality = !qualityFilter || profile._qualityLevel === qualityFilter;
    return matchesText && matchesQuality;
});

document.getElementById('tableContainer').innerHTML = buildTable(filteredProfiles, filterTerm);
updatePagination();
}

// Filtro da tabela
function filterTable(term, quality = '') {
filteredProfiles = allProfiles.filter(profile => {
    const matchesText = Object.values(profile).join(' ').toLowerCase().includes(term.toLowerCase());
    const matchesQuality = !quality || profile._qualityLevel === quality;
    return matchesText && matchesQuality;
});

currentPage = 1;
updateTable();
}

// Cache local
function cacheResults(key, data) {
try {
    localStorage.setItem(`leads_${key}`, JSON.stringify({
    data,
    timestamp: Date.now()
    }));
} catch (e) {
    console.warn('Não foi possível salvar no cache:', e);
}
}

function getCachedResults(key, maxAge = 3600000) {
try {
    const cached = localStorage.getItem(`leads_${key}`);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > maxAge) return null;
    
    return data;
} catch (e) {
    return null;
}
}

// Exportação
function exportWithMetadata(profiles, format = 'csv') {
const metadata = {
    exportDate: new Date().toISOString(),
    totalLeads: profiles.length,
    searchQuery: document.getElementById('inputProfession').value,
    location: document.getElementById('inputCity').value,
    site: document.getElementById('inputSite').value,
    qualityDistribution: {
    high: profiles.filter(p => p._qualityScore >= 70).length,
    medium: profiles.filter(p => p._qualityScore >= 40 && p._qualityScore < 70).length,
    basic: profiles.filter(p => p._qualityScore < 40).length
    }
};

if (format === 'csv') {
    const headers = Object.keys(profiles[0]).filter(h => !h.startsWith('_'));
    const csvRows = [
    `# Exportação de Leads - ${new Date().toLocaleDateString('pt-BR')}`,
    `# Total: ${metadata.totalLeads} leads`,
    `# Busca: ${metadata.searchQuery} em ${metadata.location}`,
    `# Site: ${metadata.site}`,
    `# Qualidade: ${metadata.qualityDistribution.high} alta, ${metadata.qualityDistribution.medium} média, ${metadata.qualityDistribution.basic} básica`,
    '',
    ['#', ...headers].join(',')
    ];
    
    profiles.forEach((row, index) => {
    const values = headers.map(h => `"${(row[h] || '').replace(/"/g, '""')}"`);
    csvRows.push([index + 1, ...values].join(','));
    });
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
}

function exportToXLSX(data) {
const cleanData = data.map(row => {
    const clean = {};
    Object.keys(row).forEach(key => {
    if (!key.startsWith('_')) {
        clean[key] = row[key];
    }
    });
    return clean;
});

const ws = XLSX.utils.json_to_sheet(cleanData);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Leads');
XLSX.writeFile(wb, `leads_${new Date().toISOString().split('T')[0]}.xlsx`);
}

function exportToJSON(data) {
const cleanData = data.map(row => {
    const clean = {};
    Object.keys(row).forEach(key => {
    if (!key.startsWith('_')) {
        clean[key] = row[key];
    }
    });
    return clean;
});

const jsonData = JSON.stringify(cleanData, null, 2);
const blob = new Blob([jsonData], { type: 'application/json' });
const link = document.createElement('a');
link.href = URL.createObjectURL(blob);
link.download = `leads_${new Date().toISOString().split('T')[0]}.json`;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
}

// Funções de limpeza
function clearTextarea() {
document.getElementById('inputText').value = '';
document.getElementById('inputText').focus();
}

function clearAndPaste() {
navigator.clipboard.readText().then(text => {
    clearTextarea();
    document.getElementById('inputText').value = text;
}).catch(() => showError('Erro ao acessar a área de transferência.'));
}

// Event Listeners
document.getElementById('parseBtn').addEventListener('click', () => {
const inputText = document.getElementById('inputText').value.trim();
if (!inputText) {
    showError('Cole o texto da busca.');
    return;
}

try {
    // Usar processamento em lote para melhor performance
    allProfiles = processBatch(inputText);
    originalProfiles = [...allProfiles];
    
    // Remover duplicatas automaticamente
    allProfiles = removeDuplicatesFromArray(allProfiles);
    
    // Cache dos resultados
    const cacheKey = `${document.getElementById('inputProfession').value}_${document.getElementById('inputCity').value}`;
    cacheResults(cacheKey, allProfiles);
    
    // Configurar dados filtrados
    filteredProfiles = [...allProfiles];
    currentPage = 1;
    
    // Atualizar interface
    updateTable();
    showStatistics(allProfiles);
    
    // Habilitar controles
    document.getElementById('filterInput').disabled = false;
    document.getElementById('qualityFilter').disabled = false;
    document.getElementById('duplicateBtn').disabled = false;
    document.getElementById('exportCSV').disabled = false;
    document.getElementById('exportXLSX').disabled = false;
    document.getElementById('exportJSON').disabled = false;
    
    showSuccess(`${allProfiles.length} leads processados com sucesso!`);
} catch (error) {
    showError(error.message);
}
});

document.getElementById('filterInput').addEventListener('input', e => {
const quality = document.getElementById('qualityFilter').value;
filterTable(e.target.value, quality);
});

document.getElementById('qualityFilter').addEventListener('change', e => {
const term = document.getElementById('filterInput').value;
filterTable(term, e.target.value);
});

document.getElementById('exportCSV').addEventListener('click', () => {
exportWithMetadata(filteredProfiles, 'csv');
});

document.getElementById('exportXLSX').addEventListener('click', () => {
exportToXLSX(filteredProfiles);
});

document.getElementById('exportJSON').addEventListener('click', () => {
exportToJSON(filteredProfiles);
});

// Adicionar event listener para mudança de itens por página
document.getElementById('itemsPerPage').addEventListener('change', changeItemsPerPage);

// Atualizar preview quando campos mudarem
['inputSite', 'inputProfession', 'inputCity', 'inputEmailType'].forEach(id => {
document.getElementById(id).addEventListener('input', () => {
    const preview = document.getElementById('searchPreview');
    if (preview.style.display === 'block') {
    previewSearch();
    }
});
});