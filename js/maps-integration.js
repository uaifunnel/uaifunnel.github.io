// âœ… MAPS-INTEGRATION.JS COMPLETO - VERSÃƒO 4.0 CORRIGIDA
// ==================== VARIÃVEIS GLOBAIS ====================
let currentMapsData = [];

// ==================== INICIALIZAÃ‡ÃƒO ====================
document.addEventListener('DOMContentLoaded', function() {
    setupMapsEventListeners();
    console.log('âœ… Maps Integration carregado com sucesso');
});

// ==================== PROTEÃ‡ÃƒO DA SEÃ‡ÃƒO DE MAPS ====================
function setupMapsProtection() {
    const mapsSection = document.getElementById('leadMapsSection');
    if (!mapsSection) return;

    // âœ… INTERCEPTAR TODOS OS CLIQUES DENTRO DA SEÃ‡ÃƒO MAPS
    mapsSection.addEventListener('click', function(e) {
        // Verificar se deve mostrar modal
        if (shouldShowModalForMaps(e.target)) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            // Mostrar modal atravÃ©s do sistema global
            if (window.signupSystem && !window.signupSystem.isLoggedIn && window.signupSystem.hasUsedTool) {
                window.signupSystem.showModal();
                return false;
            }
        }
    }, true); // âœ… USAR CAPTURE PHASE
}

function shouldShowModalForMaps(element) {
    // Se nÃ£o hÃ¡ sistema de cadastro ou usuÃ¡rio estÃ¡ logado, permitir
    if (!window.signupSystem || window.signupSystem.isLoggedIn || !window.signupSystem.hasUsedTool) {
        return false;
    }

    // âœ… ELEMENTOS QUE DEVEM SER BLOQUEADOS APÃ“S PRIMEIRO USO
    const restrictedSelectors = [
        // BotÃµes de exportaÃ§Ã£o CSV
        '#btn-csv',
        'button[onclick*="exportarCSV"]',
        'button[onclick*="exportCSV"]',
        '[data-export="csv"]',
        
        // Links externos da tabela Maps
        '#mapsTableBody a',
        '#searchResults a',
        'a[target="_blank"]',
        'a[href*="maps.google.com"]',
        
        // BotÃµes de aÃ§Ã£o da tabela Maps
        'button[onclick*="addToFunnel"]',
        '.btn[onclick*="addToFunnel"]',
        '.btn-outline-primary',
        '.btn-outline-secondary',
        
        // Qualquer link/botÃ£o dentro dos resultados
        '#searchResults button:not(.btn-close)',
        '#mapsResultsTitle button',
        
        // Telefones clicÃ¡veis
        'a[href^="tel:"]',
        '.telefone-link',
        '#phonefound'
    ];

    // âœ… VERIFICAR SE ELEMENTO CORRESPONDE AOS SELETORES
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

    // âœ… VERIFICAR ATRIBUTOS ONCLICK
    const onclickAttr = element.getAttribute('onclick');
    if (onclickAttr) {
        const restrictedOnclicks = [
            'exportarCSV', 'exportCSV', 'addToFunnel', 
            'exportar', 'download'
        ];
        for (const restricted of restrictedOnclicks) {
            if (onclickAttr.includes(restricted)) {
                return true;
            }
        }
    }

    // âœ… VERIFICAR SE Ã‰ UM LINK EXTERNO
    if (element.tagName === 'A' && element.href && 
        (element.href.startsWith('http') && !element.href.includes(window.location.hostname))) {
        return true;
    }

    return false;
}

// ==================== VERIFICAÃ‡ÃƒO DE PERMISSÃƒO ====================
function checkMapsPermission() {
    if (window.signupSystem) {
        const hasPermission = window.signupSystem.isLoggedIn || !window.signupSystem.hasUsedTool;
        if (!hasPermission) {
            window.signupSystem.showModal();
            return false;
        }
        return true;
    }
    return true; // Se nÃ£o hÃ¡ sistema, permitir
}

// ==================== BUSCA PRINCIPAL ====================
async function startMapsSearch() {
    console.log('ðŸ” Iniciando busca no Maps');
    
    // IDs corretos dos elementos
    const searchTerm = document.getElementById('searchTerm').value.trim();
    const maxResults = document.getElementById('maxResults').value;
    
    if (!searchTerm) {
        alert('Digite um termo de busca!');
        return;
    }

    const searchBtn = document.getElementById('searchBtn');
    const resultsSection = document.getElementById('searchResults');
    const loadingSection = document.getElementById('mapsLoading');

    // âœ… MOSTRAR LOADING COM GIF
    if (loadingSection) loadingSection.classList.remove('hidden');
    if (resultsSection) resultsSection.classList.add('hidden');
    
    // âœ… ANIMAR STEPS PROGRESSIVAMENTE
    animateLoadingSteps();

    // âœ… EFEITO NO BOTÃƒO
    if (searchBtn) {
        searchBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Buscando...';
        searchBtn.disabled = true;
    }

    try {
        console.log('ðŸ“¡ Enviando requisiÃ§Ã£o para API...');
        
        // :::::::::::::::::::::::::: NGROK SETUP ::::::::::::::::::::::::::::::
        // const response = await fetch('http://localhost:3000/api/scrape', {   BEFORE
        // const response = await fetch('https://5bd9d625f33b.ngrok-free.app/api...     NOW
        // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
        const response = await fetch('https://1f126abc3a60.ngrok-free.app/api/scrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                termo: searchTerm,
                maxResultados: parseInt(maxResults)
            })
        });

        console.log('ðŸ“¡ Resposta recebida, status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('ðŸ“Š Dados processados:', data);

        if (data.sucesso) {
            currentMapsData = data.resultados;
            displayMapsResults(data);
            
            // âœ… ESCONDER LOADING E MOSTRAR RESULTADOS
            if (loadingSection) loadingSection.classList.add('hidden');
            if (resultsSection) resultsSection.classList.remove('hidden');
            
            console.log('âœ… Busca concluÃ­da com sucesso');
        } else {
            if (loadingSection) loadingSection.classList.add('hidden');
            alert('Erro: ' + data.erro);
            console.error('âŒ Erro da API:', data.erro);
        }

    } catch (error) {
        console.error('âŒ Erro na requisiÃ§Ã£o:', error);
        
        if (loadingSection) loadingSection.classList.add('hidden');
        
        if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
            alert('Erro de conexÃ£o. Verifique se o servidor backend estÃ¡ rodando.');
        } else {
            alert('Erro: ' + error.message);
        }
    } finally {
        // âœ… RESTAURAR BOTÃƒO
        if (searchBtn) {
            searchBtn.innerHTML = '<i class="bi bi-search"></i> Buscar';
            searchBtn.disabled = false;
        }
    }
}

// ==================== ANIMAÃ‡ÃƒO DOS STEPS ====================
function animateLoadingSteps() {
    const steps = document.querySelectorAll('.step-text');
    
    if (!steps.length) return;
    
    // Reset todos os steps
    steps.forEach(step => {
        step.classList.remove('active');
    });
    
    // Animar steps sequencialmente
    steps.forEach((step, index) => {
        setTimeout(() => {
            step.classList.add('active');
        }, (index + 1) * 1500); // 1.5s entre cada step
    });
}

// ==================== EXIBIÃ‡ÃƒO DE RESULTADOS ====================
function displayMapsResults(data) {
    const tbody = document.getElementById('mapsTableBody');
    const titleElement = document.getElementById('mapsResultsTitle');
    
    if (!tbody || !titleElement) {
        console.error('âŒ Elementos da tabela nÃ£o encontrados no HTML');
        return;
    }
    
    console.log('ðŸ“‹ Exibindo resultados na tabela...');
    
    titleElement.textContent = `${data.total} estabelecimentos encontrados para "${data.termo}"`;
    
    // Limpar tabela anterior
    tbody.innerHTML = '';
    
    // Contar telefones encontrados
    let telefonesEncontrados = 0;
    
    // Preencher tabela com resultados
    data.resultados.forEach(item => {
        if (item.telefone !== 'Telefone nÃ£o encontrado') {
            telefonesEncontrados++;
        }

        const row = tbody.insertRow();
        row.innerHTML = `
            <td><strong>${item.indice}</strong></td>
            <td><strong>${item.nome}</strong></td>
            <td>${item.endereco}</td>
            <td class="telefone-cell">${formatarTelefone(item.telefone)}</td>
            <td>${formatarSite(item.site)}</td>
            <td>${formatarAvaliacao(item.avaliacao)}</td>
            <td>${item.categoria}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary btn-sm" onclick="addToFunnel('${item.nome.replace(/'/g, "\\'")}', '${item.telefone}')">
                        <i class="bi bi-plus"></i> Adicionar
                    </button>
                    <a href="${item.link}" target="_blank" class="btn btn-outline-secondary btn-sm">
                        <i class="bi bi-geo-alt"></i> Ver
                    </a>
                </div>
            </td>
        `;
    });
    
    // Mostrar estatÃ­sticas
    if (telefonesEncontrados > 0) {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'alert alert-info mt-2';
        infoDiv.innerHTML = `ðŸ“ž ${telefonesEncontrados}/${data.total} estabelecimentos com telefone encontrado`;
        titleElement.appendChild(infoDiv);
    }

    // âœ… MARCAR FERRAMENTA COMO USADA APÃ“S PRIMEIRO SUCESSO
    // âœ… CORRIGIDO:
    if (window.signupSystem && data.resultados && data.resultados.length > 0) {
        window.signupSystem.markToolAsUsed();  // â† FUNÃ‡ÃƒO CORRETA
        console.log('ðŸŽ¯ Ferramenta marcada como utilizada');
    }


    // âœ… ATIVAR PROTEÃ‡ÃƒO APÃ“S EXIBIR RESULTADOS
    setTimeout(() => {
        setupMapsProtection();
    }, 100);
    
    console.log('âœ… Resultados exibidos com sucesso');
}

// ==================== FORMATAÃ‡ÃƒO ====================
function formatarTelefone(telefone) {
    if (!telefone || telefone === 'Telefone nÃ£o encontrado') {
        return '<span class="text-muted">NÃ£o encontrado</span>';
    }

    // Remover caracteres nÃ£o numÃ©ricos
    let numeroLimpo = telefone.replace(/\D/g, '');
    
    // Remover cÃ³digo do paÃ­s se houver
    if (numeroLimpo.startsWith('55') && numeroLimpo.length > 11) {
        numeroLimpo = numeroLimpo.substring(2);
    }
    
    // Remover zero do DDD
    if (numeroLimpo.length === 11 && numeroLimpo.startsWith('0')) {
        numeroLimpo = numeroLimpo.substring(1);
    }
    
    let telefoneFormatado = '';
    
    if (numeroLimpo.length === 11) {
        // Celular: (21) 9 9294-2010
        const ddd = numeroLimpo.substring(0, 2);
        const nono = numeroLimpo.substring(2, 3);
        const parte1 = numeroLimpo.substring(3, 7);
        const parte2 = numeroLimpo.substring(7, 11);
        telefoneFormatado = `(${ddd}) ${nono} ${parte1}-${parte2}`;
    } else if (numeroLimpo.length === 10) {
        // Fixo: (21) 3456-7789
        const ddd = numeroLimpo.substring(0, 2);
        const parte1 = numeroLimpo.substring(2, 6);
        const parte2 = numeroLimpo.substring(6, 10);
        telefoneFormatado = `(${ddd}) ${parte1}-${parte2}`;
    } else {
        telefoneFormatado = telefone;
    }
    
    return `<a href="tel:${numeroLimpo}" id="phonefound" class="telefone-link text-success">${telefoneFormatado}</a>`;
}

function formatarSite(site) {
    if (site === 'Site nÃ£o encontrado' || !site) {
        return '<span class="text-muted">NÃ£o encontrado</span>';
    }
    if (site.startsWith('http')) {
        return `<a href="${site}" target="_blank" class="text-primary"><i class="bi bi-globe"></i> Visitar</a>`;
    }
    return '<span class="text-muted">IndisponÃ­vel</span>';
}

function formatarAvaliacao(avaliacao) {
    if (avaliacao === 'Sem avaliaÃ§Ã£o') {
        return '<span class="text-muted">Sem avaliaÃ§Ã£o</span>';
    }
    return `<span class="text-warning"><i class="bi bi-star-fill"></i> ${avaliacao}</span>`;
}

// ==================== FUNÃ‡Ã•ES COM VERIFICAÃ‡ÃƒO DE PERMISSÃƒO ====================
// âœ… FUNÃ‡ÃƒO DE EXPORTAÃ‡ÃƒO COM VERIFICAÃ‡ÃƒO
function exportarCSV() {
    console.log('ðŸ“„ Tentativa de exportaÃ§Ã£o CSV');
    
    // Verificar permissÃ£o ANTES de executar
    if (!checkMapsPermission()) {
        console.log('âŒ ExportaÃ§Ã£o CSV bloqueada - usuÃ¡rio precisa se cadastrar');
        return false;
    }
    
    if (!currentMapsData || currentMapsData.length === 0) {
        alert('Nenhum dado para exportar');
        return;
    }

    try {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Nome,EndereÃ§o,Telefone,Site,AvaliaÃ§Ã£o,Categoria\n"
            + currentMapsData.map(item => 
                `"${item.nome}","${item.endereco}","${item.telefone}","${item.site}","${item.avaliacao}","${item.categoria}"`
            ).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `estabelecimentos_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('âœ… CSV exportado com sucesso');
        
    } catch (error) {
        console.error('âŒ Erro ao exportar CSV:', error);
        alert('Erro ao exportar arquivo CSV');
    }
}

// âœ… FUNÃ‡ÃƒO ADICIONAR AO FUNIL COM VERIFICAÃ‡ÃƒO
function addToFunnel(name, phone) {
    console.log('ðŸ“‹ Tentativa de adicionar ao funil:', name);
    
    // Verificar permissÃ£o ANTES de executar
    if (!checkMapsPermission()) {
        console.log('âŒ Adicionar ao funil bloqueado - usuÃ¡rio precisa se cadastrar');
        return false;
    }

    console.log('âœ… Adicionando ao funil:', { name, phone });
    alert(`${name} adicionado ao seu funil de leads!`);
    
    // IntegraÃ§Ã£o com sistema de CRM local
    try {
        const existingFunnel = JSON.parse(localStorage.getItem('leadsFunnel') || '[]');
        const newLead = {
            id: Date.now(),
            name: name,
            phone: phone,
            addedAt: new Date().toISOString(),
            source: 'maps',
            status: 'new'
        };
        
        existingFunnel.push(newLead);
        localStorage.setItem('leadsFunnel', JSON.stringify(existingFunnel));
        
        console.log('âœ… Lead adicionado ao funil local');
    } catch (error) {
        console.error('âŒ Erro ao salvar no funil:', error);
    }
}

// ==================== UTILITÃRIOS ====================
function clearMapsForm() {
    const searchTerm = document.getElementById('searchTerm');
    const maxResults = document.getElementById('maxResults');
    const resultsSection = document.getElementById('searchResults');
    
    if (searchTerm) searchTerm.value = '';
    if (maxResults) maxResults.value = '50';
    if (resultsSection) resultsSection.classList.add('hidden');
    
    currentMapsData = [];
    console.log('ðŸ§¹ FormulÃ¡rio Maps limpo');
}

function refreshMapsSearch() {
    if (currentMapsData.length > 0) {
        startMapsSearch();
    }
}

// ==================== EVENT LISTENERS ====================
function setupMapsEventListeners() {
    console.log('ðŸ”§ Configurando event listeners do Maps...');
    
    // BotÃ£o de busca
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', startMapsSearch);
        console.log('âœ… Event listener do botÃ£o buscar configurado');
    } else {
        console.warn('âš ï¸ BotÃ£o searchBtn nÃ£o encontrado');
    }
    
    // Enter no campo de busca
    const searchTerm = document.getElementById('searchTerm');
    if (searchTerm) {
        searchTerm.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                startMapsSearch();
            }
        });
        console.log('âœ… Event listener do campo busca configurado');
    } else {
        console.warn('âš ï¸ Campo searchTerm nÃ£o encontrado');
    }
    
    // BotÃ£o de exportar CSV
    const exportBtn = document.getElementById('btn-csv');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportarCSV);
        console.log('âœ… Event listener do botÃ£o CSV configurado');
    } else {
        console.log('â„¹ï¸ BotÃ£o btn-csv nÃ£o encontrado (normal se nÃ£o existir)');
    }
    
    console.log('âœ… Event listeners do Maps configurados com sucesso');
}

// ==================== EXPORTAR FUNÃ‡Ã•ES GLOBAIS ====================
// âœ… DISPONIBILIZAR FUNÃ‡Ã•ES GLOBALMENTE PARA USO NO HTML
window.startMapsSearch = startMapsSearch;
window.exportarCSV = exportarCSV;
window.addToFunnel = addToFunnel;
window.clearMapsForm = clearMapsForm;
window.refreshMapsSearch = refreshMapsSearch;

// âœ… DEBUG - VERIFICAR SE FUNÃ‡Ã•ES ESTÃƒO DISPONÃVEIS
console.log('âœ… Maps Integration carregado completamente');
console.log('âœ… startMapsSearch disponÃ­vel:', typeof window.startMapsSearch);
console.log('âœ… exportarCSV disponÃ­vel:', typeof window.exportarCSV);
console.log('âœ… addToFunnel disponÃ­vel:', typeof window.addToFunnel);

// âœ… VERIFICAÃ‡ÃƒO FINAL DE INTEGRIDADE
if (typeof window.startMapsSearch !== 'function') {
    console.error('âŒ ERRO: startMapsSearch nÃ£o foi definida corretamente!');
} else {
    console.log('ðŸŽ‰ Maps Integration inicializado com sucesso!');
}
