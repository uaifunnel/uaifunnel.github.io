// ✅ SCRAPER.JS COMPLETO - VERSÃO 4.0 COM SISTEMA DE CADASTRO INTEGRADO

// ==================== VARIÁVEIS GLOBAIS ====================
let allProfiles = [];
let originalProfiles = [];
let filteredProfiles = [];
let actionHistory = [];
let currentPage = 1;
let itemsPerPage = 50;
let isDarkMode = false;

// ================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', function() {
    loadDarkModePreference();
    loadSearchTemplates();
    initializeEventListeners();
    setupSectionProtection(); // ✅ NOVA FUNÇÃO DE PROTEÇÃO
});

// ==================== PROTEÇÃO DA SEÇÃO DE LEADS ORGÂNICOS ====================
function setupSectionProtection() {
    const doingSection = document.getElementById('doing');
    if (!doingSection) return;

    // ✅ INTERCEPTAR TODOS OS CLIQUES DENTRO DA SEÇÃO
    doingSection.addEventListener('click', function(e) {
        // Verificar se deve mostrar modal
        if (shouldShowModalForSection(e.target)) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            // Mostrar modal através do sistema global
            if (window.signupSystem && !window.signupSystem.isLoggedIn && window.signupSystem.hasUsedTool) {
                window.signupSystem.showModal();
                return false;
            }
        }
    }, true); // ✅ USAR CAPTURE PHASE
}

function shouldShowModalForSection(element) {
    // Se não há sistema de cadastro ou usuário está logado, permitir
    if (!window.signupSystem || window.signupSystem.isLoggedIn || !window.signupSystem.hasUsedTool) {
        return false;
    }

    // ✅ ELEMENTOS QUE DEVEM SER BLOQUEADOS APÓS PRIMEIRO USO
    const restrictedSelectors = [
        // Botões de exportação
        'button[onclick*="exportTo"]',
        'button[onclick*="export"]',
        '#exportCSV', '#exportXLSX', '#exportJSON',
        '.export-btn', '[data-export]',
        
        // Links de perfis
        'a[href*="instagram.com"]',
        'a[href*="linkedin.com"]', 
        'a[href*="facebook.com"]',
        'a[target="_blank"]',
        '.profile-link',
        
        // Botões de ação
        '#filterBtn', '#downloadBtn', '#duplicateBtn',
        '.action-btn', '.download-link',
        'button[onclick*="remove"]',
        'button[onclick*="duplicate"]',
        'button[onclick*="undo"]',
        
        // Qualquer link externo da tabela
        '#resultsTable a',
        '#tableContainer a',
        
        // Controles de tabela
        '.table a', '.table button:not(.btn-close)',
        
        // Botões de paginação
        '#prevPage', '#nextPage',
        'button[onclick*="changePage"]',
        
        // Filtros (exceto input de texto)
        '#qualityFilter',
        
        // Preview de busca (permitir apenas na primeira vez)
        '#previwbtn'
    ];

    // ✅ VERIFICAR SE ELEMENTO CORRESPONDE AOS SELETORES
    for (const selector of restrictedSelectors) {
        try {
            if (element.matches && element.matches(selector)) {
                return true;
            }
            if (element.closest && element.closest(selector)) {
                return true;
            }
        } catch (error) {
            continue;
        }
    }

    // ✅ VERIFICAR ATRIBUTOS ONCLICK
    const onclickAttr = element.getAttribute('onclick');
    if (onclickAttr) {
        const restrictedOnclicks = [
            'exportTo', 'export', 'remove', 'duplicate', 
            'undo', 'changePage', 'filter', 'download'
        ];
        for (const restricted of restrictedOnclicks) {
            if (onclickAttr.includes(restricted)) {
                return true;
            }
        }
    }

    // ✅ VERIFICAR SE É UM LINK EXTERNO
    if (element.tagName === 'A' && element.href && 
        (element.href.startsWith('http') && !element.href.includes(window.location.hostname))) {
        return true;
    }

    return false;
}

// ==================== DARK MODE ====================
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);

    const darkModeButton = document.getElementById('darkModeToggle');
    if (darkModeButton) {
        darkModeButton.innerHTML = isDarkMode ? 
            '<i class="bi bi-brightness-high"></i>' : 
            '<i class="bi bi-moon"></i>';
    }

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

// ==================== MENSAGENS E FEEDBACK ====================
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 3000);
    }
}

// ==================== VALIDAÇÃO E UTILITÁRIOS ====================
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function improvedEmailRegex() {
    return /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ==================== PRÉ-PROCESSAMENTO ====================
function preprocessGoogleResults(text) {
    return text
        .replace(/site:instagram\.com[^"]*"[^"]*"/g, '')
        .replace(/Todas\nVídeos curtos\nImagens[^\n]*/g, '')
        .replace(/SafeSearch\nDesativar\nBorrar\nFiltrar/g, '')
        .replace(/Mostrar mais imagens/g, '')
        .replace(/Os resultados são personalizados[^]*$/g, '')
        .replace(/\n\s*\n\s*\n/g, '\n\n');
}

// ==================== EXTRAÇÃO AVANÇADA ====================
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

function extractPhonesAdvanced(text) {
    const phonePatterns = [
        /\+55\s?\(?\d{2}\)?\s?\d{4,5}[-.\s]?\d{4}/g,
        /\(?\d{2}\)?\s?\d{4,5}[-.\s]?\d{4}/g,
        /\d{2}\s?\d{4,5}[-.\s]?\d{4}/g
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

function extractInstagramUsername(text) {
    const patterns = [
        /@([a-zA-Z0-9._-]+)/g,
        /instagram\.com\/([a-zA-Z0-9._-]+)/g,
        /Instagram · ([a-zA-Z0-9._-]+)/g
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

// ==================== PARSING AVANÇADO ====================
function parseInstagramAdvanced(text) {
    const results = [];
    const blocks = text.split(/\n(?=\w+.*Instagram|@\w+|\w+.*\(\@\w+\))/);

    blocks.forEach(block => {
        try {
            const lines = block.split('\n').map(l => l.trim()).filter(l => l);
            if (lines.length < 2) return;
            
            let username = '';
            let displayName = '';
            
            const usernamePatterns = [
                /^([a-zA-Z0-9._-]+)\s*\(\@([a-zA-Z0-9._-]+)\)/,
                /Instagram · ([a-zA-Z0-9._-]+)/,
                /@([a-zA-Z0-9._-]+)/
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
            
            const bio = lines.find(line => 
                line.length > 30 && 
                !line.includes('seguidores') &&
                !line.includes('marcações') &&
                !line.includes('Instagram') &&
                !line.includes('@') &&
                !line.match(/^\d+:\d+$/) &&
                !line.includes('site:instagram.com')
            ) || '';
            
            const emails = extractEmailsAdvanced(block);
            const phones = extractPhonesAdvanced(block);
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
            const emails = extractEmailsAdvanced(block);
            const phones = extractPhonesAdvanced(block);

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

// ==================== GERAÇÃO DE LINKS ====================
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

// ==================== BUSCA AVANÇADA ====================
function buildAdvancedQuery() {
    const site = document.getElementById('inputSite').value.trim();
    const keyword = document.getElementById('inputProfession').value.trim();
    const location = document.getElementById('inputCity').value.trim();
    const emailType = document.getElementById('inputEmailType').value.trim();

    if (!site || !keyword || !location) {
        throw new Error('Preencha Site, Palavra-chave e Localização.');
    }

    const excludeTerms = '-"fanpage"';
    const includeTerms = 'contato';

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

// ✅ BUSCA AUTOMATIZADA INTEGRADA COM BACKEND
async function openSearchAutomatized() {
    // ✅ DECLARAR VARIÁVEIS NO ESCOPO PRINCIPAL
    let searchBtn = null;
    let originalBtnText = '';
    
    try {
        const site = document.getElementById('inputSite').value.trim();
        const keyword = document.getElementById('inputProfession').value.trim();
        const location = document.getElementById('inputCity').value.trim();
        const emailType = document.getElementById('inputEmailType').value.trim();
        
        if (!site || !keyword || !location) {
            showError('Preencha Site, Palavra-chave e Localização.');
            return;
        }

        // ✅ PEGAR O BOTÃO E ALTERAR ESTADO
        searchBtn = document.getElementById('autoSearchBtn');
        
        if (searchBtn) {
            originalBtnText = searchBtn.innerHTML;
            
            // ✅ ALTERAR BOTÃO PARA LOADING
            searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
            searchBtn.disabled = true;
        }
        
        showSuccess('Iniciando busca automatizada...');
        
        // Mostrar loading se existir
        const loadingDiv = document.getElementById('organicLoading');
        if (loadingDiv) {
            loadingDiv.classList.remove('hidden');
        }
        
        // :::::::::::::::::::::::::: NGROK SETUP ::::::::::::::::::::::::::::::
        // const response = await fetch('http://localhost:3000/api/search-organic', {   BEFORE
        // const response = await fetch('https://5bd9d625f33b.ngrok-free.app/API...     NOW
        // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
        const response = await fetch('https://54d6c6c40178.ngrok-free.app/api/search-organic', {  //NOW
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                termo: keyword,
                maxResultados: 50,
                site: site,
                localizacao: location,
                emailType: emailType
            })
        });
        
        const data = await response.json();
        
        if (data.sucesso) {
            // Colocar texto na textarea
            const inputText = document.getElementById('inputText');
            if (inputText) {
                inputText.value = data.textoParaProcessamento;
            }
            
            // Processar automaticamente
            try {
                const profiles = parseProfiles(data.textoParaProcessamento);
                allProfiles = profiles;
                originalProfiles = [...profiles];
                filteredProfiles = [...profiles];
                
                // Remover duplicatas automaticamente
                allProfiles = removeDuplicatesFromArray(allProfiles);
                filteredProfiles = [...allProfiles];
                
                // Atualizar interface
                updateTable();
                showStatistics(allProfiles);
                enableControls();
                
                showSuccess(`✅ ${data.totalResultados} resultados processados automaticamente! ${profiles.length} perfis extraídos.`);
            } catch (parseError) {
                showError('Erro ao processar perfis: ' + parseError.message);
                console.error('Erro no parsing:', parseError);
            }
            
        } else {
            showError('Erro: ' + data.erro);
        }
        
    } catch (error) {
        showError('Erro na busca automatizada: ' + error.message);
        console.error('Erro completo:', error);
    } finally {
        // ✅ ESCONDER LOADING
        const loadingDiv = document.getElementById('organicLoading');
        if (loadingDiv) {
            loadingDiv.classList.add('hidden');
        }
        
        // ✅ RESTAURAR BOTÃO
        if (searchBtn) {
            searchBtn.innerHTML = originalBtnText || '<i class="bi bi-search"></i> Buscar G';
            searchBtn.disabled = false;
        }
    }
}

// ==================== PREVIEW DE BUSCA ====================
function previewSearch() {
    try {
        const query = buildAdvancedQuery();
        const preview = document.getElementById('searchPreview');
        if (preview) {
            preview.style.display = 'block';
            preview.innerHTML = `
                <strong>🔍 Busca que será executada:</strong><br>
                <code>${query}</code><br>
                <small class="text-muted">Dica: Esta busca irá procurar perfis com a palavra-chave especificada na localização desejada.</small>
            `;
        }
    } catch (error) {
        showError(error.message);
    }
}

// ==================== TEMPLATES DE BUSCA ====================
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
        // Implementar dropdown se necessário
    } catch (error) {
        console.warn('Erro ao carregar templates:', error);
    }
}

// ==================== SISTEMA DE QUALIDADE ====================
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

// ==================== VALIDAÇÃO E PARSING PRINCIPAL ====================
function validateExtractedData(profiles) {
    return profiles.filter(profile => {
        return profile.Nome && 
            profile.Nome.length > 2 && 
            !profile.Nome.includes('gmail.com') &&
            !profile.Nome.includes('instagram') &&
            !profile.Nome.includes('Todas') &&
            !profile.Nome.match(/^\d+:\d+$/);
    });
}

// ✅ FUNÇÃO parseProfiles CORRIGIDA
function parseProfiles(text) {
    if (!text || text.trim().length === 0) {
        throw new Error('Texto vazio ou inválido');
    }

    const site = document.getElementById('inputSite').value.toLowerCase();
    let results = [];

    try {
        if (site.includes('instagram')) {
            results = parseInstagramAdvanced(preprocessGoogleResults(text));
        } else if (site.includes('linkedin')) {
            results = parseLinkedInImproved(text);
        } else {
            results = parseInstagramAdvanced(preprocessGoogleResults(text));
        }
        
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

// ==================== GESTÃO DE DUPLICATAS ====================
function removeDuplicatesFromArray(profiles) {
    const seen = new Map();

    return profiles.filter(profile => {
        const name = profile.Nome.toLowerCase().trim();
        const email = (profile['E-mail'] || '').toLowerCase().trim();
        const phone = (profile.Telefone || '').replace(/\D/g, '');
        
        const key = `${name}-${email}-${phone}`;
        
        if (seen.has(key)) {
            return false;
        }
        
        seen.set(key, true);
        return true;
    });
}

// ✅ FUNÇÃO COM VERIFICAÇÃO DE PERMISSÃO
function removeDuplicates() {
    // Verificar permissão antes de executar
    if (!checkPermission()) return false;

    const originalCount = allProfiles.length;
    saveAction('removeDuplicates', allProfiles);

    allProfiles = removeDuplicatesFromArray(allProfiles);
    filteredProfiles = [...allProfiles];
    const newCount = allProfiles.length;

    if (originalCount > newCount) {
        showSuccess(`Removidas ${originalCount - newCount} duplicatas!`);
        updateTable();
        showStatistics(allProfiles);
    } else {
        showSuccess('Nenhuma duplicata encontrada!');
    }
}

// ==================== HISTÓRICO DE AÇÕES ====================
function saveAction(action, data) {
    actionHistory.push({
        action,
        data: JSON.parse(JSON.stringify(data)),
        timestamp: Date.now()
    });

    if (actionHistory.length > 10) {
        actionHistory.shift();
    }

    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) undoBtn.disabled = false;
}

// ✅ FUNÇÃO COM VERIFICAÇÃO DE PERMISSÃO
function undoLastAction() {
    // Verificar permissão antes de executar
    if (!checkPermission()) return false;

    if (actionHistory.length === 0) return;

    const lastAction = actionHistory.pop();
    allProfiles = lastAction.data;
    filteredProfiles = [...allProfiles];

    updateTable();
    showStatistics(allProfiles);
    showSuccess('Ação desfeita!');

    const undoBtn = document.getElementById('undoBtn');
    if (actionHistory.length === 0 && undoBtn) {
        undoBtn.disabled = true;
    }
}

// ==================== VERIFICAÇÃO DE PERMISSÃO ====================
function checkPermission() {
    if (window.signupSystem) {
        const hasPermission = window.signupSystem.isLoggedIn || !window.signupSystem.hasUsedTool;
        if (!hasPermission) {
            window.signupSystem.showModal();
            return false;
        }
        return true;
    }
    return true; // Se não há sistema, permitir
}

// ==================== PAGINAÇÃO ====================
// ✅ FUNÇÃO COM VERIFICAÇÃO DE PERMISSÃO
function changePage(direction) {
    // Verificar permissão antes de executar
    if (!checkPermission()) return false;

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
    const itemsSelect = document.getElementById('itemsPerPage');
    if (itemsSelect) {
        itemsPerPage = parseInt(itemsSelect.value);
        currentPage = 1;
        updateTable();
        updatePagination();
    }
}

function updatePagination() {
    const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);
    
    const pageInfo = document.getElementById('pageInfo');
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    const paginationContainer = document.getElementById('paginationContainer');

    if (pageInfo) {
        pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    }
    
    if (prevPage) prevPage.disabled = currentPage === 1;
    if (nextPage) nextPage.disabled = currentPage === totalPages;

    if (paginationContainer) {
        paginationContainer.style.display = totalPages > 1 ? 'flex' : 'none';
    }
}

// ==================== ESTATÍSTICAS ====================
function showStatistics(profiles) {
    const stats = {
        total: profiles.length,
        withEmail: profiles.filter(p => p['E-mail']).length,
        withPhone: profiles.filter(p => p.Telefone).length,
        highQuality: profiles.filter(p => p._qualityScore >= 70).length,
        mediumQuality: profiles.filter(p => p._qualityScore >= 40 && p._qualityScore < 70).length,
        basicQuality: profiles.filter(p => p._qualityScore < 40).length
    };

    const statsContainer = document.getElementById('statsContainer');
    if (statsContainer) {
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
        statsContainer.innerHTML = statsHtml;
    }
}

// ==================== PROGRESSO E PROCESSAMENTO ====================
function updateProgress(percent) {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const progressContainer = document.getElementById('progressContainer');

    if (progressContainer) {
        progressContainer.style.display = 'block';
    }
    
    if (progressBar) {
        progressBar.style.width = percent + '%';
    }
    
    if (progressText) {
        progressText.textContent = `Processando... ${Math.round(percent)}%`;
    }

    if (percent >= 100) {
        setTimeout(() => {
            if (progressContainer) {
                progressContainer.style.display = 'none';
            }
        }, 1000);
    }
}

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

// ==================== HIGHLIGHT E FILTROS ====================
function highlightText(text, term) {
    if (!term) return text;
    const re = new RegExp(`(${escapeRegExp(term)})`, 'gi');
    return text.replace(re, '<mark>$1</mark>');
}

function filterTable(term, quality = '') {
    filteredProfiles = allProfiles.filter(profile => {
        const matchesText = Object.values(profile).join(' ').toLowerCase().includes(term.toLowerCase());
        const matchesQuality = !quality || profile._qualityLevel === quality;
        return matchesText && matchesQuality;
    });

    currentPage = 1;
    updateTable();
}

// ==================== CONSTRUÇÃO DA TABELA ====================
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

function updateTable() {
    const filterInput = document.getElementById('filterInput');
    const qualityFilter = document.getElementById('qualityFilter');
    const tableContainer = document.getElementById('tableContainer');
    
    const filterTerm = filterInput ? filterInput.value : '';
    const qualityValue = qualityFilter ? qualityFilter.value : '';

    filteredProfiles = allProfiles.filter(profile => {
        const matchesText = Object.values(profile).join(' ').toLowerCase().includes(filterTerm.toLowerCase());
        const matchesQuality = !qualityValue || profile._qualityLevel === qualityValue;
        return matchesText && matchesQuality;
    });

    if (tableContainer) {
        tableContainer.innerHTML = buildTable(filteredProfiles, filterTerm);
    }
    
    updatePagination();

    // Marcar ferramenta como usada após primeiro sucesso
    if (allProfiles.length > 0 && window.SignupSystem) {
        SignupSystem.markAsUsed();
    }
}

// ==================== CACHE LOCAL ====================
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

// ==================== EXPORTAÇÃO COM VERIFICAÇÃO ====================
// ✅ FUNÇÃO COM VERIFICAÇÃO DE PERMISSÃO
function exportToCSV() {
    // Verificar permissão ANTES de executar
    if (!checkPermission()) return false;
    
    exportWithMetadata(filteredProfiles, 'csv');
}

// ✅ FUNÇÃO COM VERIFICAÇÃO DE PERMISSÃO  
function exportToXLSX() {
    // Verificar permissão ANTES de executar
    if (!checkPermission()) return false;
    
    exportToXLSXFile(filteredProfiles);
}

// ✅ FUNÇÃO COM VERIFICAÇÃO DE PERMISSÃO
function exportToJSON() {
    // Verificar permissão ANTES de executar
    if (!checkPermission()) return false;
    
    const jsonData = JSON.stringify(filteredProfiles, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSuccess('JSON exportado com sucesso!');
}

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
        
        showSuccess('CSV exportado com sucesso!');
    }
}

function exportToXLSXFile(data) {
    if (typeof XLSX === 'undefined') {
        showError('Biblioteca XLSX não carregada');
        return;
    }

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
    
    showSuccess('XLSX exportado com sucesso!');
}

// ==================== FUNÇÕES DE LIMPEZA ====================
function clearTextarea() {
    const inputText = document.getElementById('inputText');
    if (inputText) {
        inputText.value = '';
        inputText.focus();
    }
}

function clearAndPaste() {
    if (navigator.clipboard) {
        navigator.clipboard.readText().then(text => {
            clearTextarea();
            const inputText = document.getElementById('inputText');
            if (inputText) {
                inputText.value = text;
            }
        }).catch(() => showError('Erro ao acessar a área de transferência.'));
    } else {
        showError('Área de transferência não suportada neste navegador.');
    }
}

// ==================== CONTROLES DA INTERFACE ====================
function enableControls() {
    const controls = [
        'filterInput', 'qualityFilter', 'duplicateBtn', 
        'exportCSV', 'exportXLSX', 'exportJSON'
    ];
    
    controls.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.disabled = false;
    });
}

function generateTable() {
    const inputText = document.getElementById('inputText');
    if (!inputText || !inputText.value.trim()) {
        showError('Cole o texto da busca.');
        return;
    }

    try {
        const text = inputText.value.trim();
        allProfiles = processBatch(text);
        originalProfiles = [...allProfiles];
        
        allProfiles = removeDuplicatesFromArray(allProfiles);
        
        const cacheKey = `${document.getElementById('inputProfession').value}_${document.getElementById('inputCity').value}`;
        cacheResults(cacheKey, allProfiles);
        
        filteredProfiles = [...allProfiles];
        currentPage = 1;
        
        updateTable();
        showStatistics(allProfiles);
        enableControls();
        
        showSuccess(`${allProfiles.length} leads processados com sucesso!`);
    } catch (error) {
        showError(error.message);
    }
}

// ==================== EVENT LISTENERS ====================
function initializeEventListeners() {
    // Botão de processar
    const parseBtn = document.getElementById('parseBtn');
    if (parseBtn) {
        parseBtn.addEventListener('click', generateTable);
    }

    // Filtros - Input de texto (permitir sempre)
    const filterInput = document.getElementById('filterInput');
    if (filterInput) {
        filterInput.addEventListener('input', e => {
            const qualityFilter = document.getElementById('qualityFilter');
            const quality = qualityFilter ? qualityFilter.value : '';
            filterTable(e.target.value, quality);
        });
    }

    // Preview de busca
    const previewFields = ['inputSite', 'inputProfession', 'inputCity', 'inputEmailType'];
    previewFields.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', () => {
                const preview = document.getElementById('searchPreview');
                if (preview && preview.style.display === 'block') {
                    previewSearch();
                }
            });
        }
    });

    // Botões de limpeza
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearTextarea);
    }
}

// ==================== EXPORTAR FUNÇÕES GLOBAIS ====================
window.openSearchAutomatized = openSearchAutomatized;
window.generateTable = generateTable;
window.previewSearch = previewSearch;
window.toggleDarkMode = toggleDarkMode;
window.removeDuplicates = removeDuplicates;
window.undoLastAction = undoLastAction;
window.changePage = changePage;
window.clearTextarea = clearTextarea;
window.clearAndPaste = clearAndPaste;
window.exportToCSV = exportToCSV;
window.exportToXLSX = exportToXLSX;
window.exportToJSON = exportToJSON;



