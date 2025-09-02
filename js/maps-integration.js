// ✅ MAPS-INTEGRATION.JS COMPLETO - VERSÃO 4.0 COM SISTEMA DE CADASTRO INTEGRADO

// ==================== VARIÁVEIS GLOBAIS ====================
let currentMapsData = [];

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', function() {
    setupMapsEventListeners();
});

// ==================== PROTEÇÃO DA SEÇÃO DE MAPS ====================
function setupMapsProtection() {
    const mapsSection = document.getElementById('leadMapsSection');
    if (!mapsSection) return;

    // ✅ INTERCEPTAR TODOS OS CLIQUES DENTRO DA SEÇÃO MAPS
    mapsSection.addEventListener('click', function(e) {
        // Verificar se deve mostrar modal
        if (shouldShowModalForMaps(e.target)) {
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

function shouldShowModalForMaps(element) {
    // Se não há sistema de cadastro ou usuário está logado, permitir
    if (!window.signupSystem || window.signupSystem.isLoggedIn || !window.signupSystem.hasUsedTool) {
        return false;
    }

    // ✅ ELEMENTOS QUE DEVEM SER BLOQUEADOS APÓS PRIMEIRO USO
    const restrictedSelectors = [
        // Botões de exportação CSV
        '#btn-csv',
        'button[onclick*="exportarCSV"]',
        'button[onclick*="exportCSV"]',
        '[data-export="csv"]',
        
        // Links externos da tabela Maps
        '#mapsTableBody a',
        '#searchResults a',
        'a[target="_blank"]',
        'a[href*="maps.google.com"]',
        
        // Botões de ação da tabela Maps
        'button[onclick*="addToFunnel"]',
        '.btn[onclick*="addToFunnel"]',
        '.btn-outline-primary',
        '.btn-outline-secondary',
        
        // Qualquer link/botão dentro dos resultados
        '#searchResults button:not(.btn-close)',
        '#mapsResultsTitle button',
        
        // Telefones clicáveis
        'a[href^="tel:"]',
        '.telefone-link',
        '#phonefound'
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
            'exportarCSV', 'exportCSV', 'addToFunnel', 
            'exportar', 'download'
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

// ==================== VERIFICAÇÃO DE PERMISSÃO ====================
function checkMapsPermission() {
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

// ==================== BUSCA PRINCIPAL ====================
async function startMapsSearch() {
    // IDs corretos
    const searchTerm = document.getElementById('searchTerm').value.trim();
    const maxResults = document.getElementById('maxResults').value;
    
    if (!searchTerm) {
        alert('Digite um termo de busca!');
        return;
    }

    const searchBtn = document.getElementById('searchBtn');
    const resultsSection = document.getElementById('searchResults');
    const loadingSection = document.getElementById('mapsLoading');

    // ✅ MOSTRAR LOADING COM GIF
    loadingSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    
    // ✅ ANIMAR STEPS PROGRESSIVAMENTE
    animateLoadingSteps();

    // ✅ EFEITO NO BOTÃO
    searchBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Buscando...';
    searchBtn.disabled = true;

    try {
        // Conectar com o Google Maps Scraper API
        const response = await fetch('http://localhost:3000/api/scrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                termo: searchTerm,
                maxResultados: parseInt(maxResults)
            })
        });

        const data = await response.json();

        if (data.sucesso) {
            currentMapsData = data.resultados;
            displayMapsResults(data);
            
            // ✅ ESCONDER LOADING E MOSTRAR RESULTADOS
            loadingSection.classList.add('hidden');
            resultsSection.classList.remove('hidden');
        } else {
            loadingSection.classList.add('hidden');
            alert('Erro: ' + data.erro);
        }

    } catch (error) {
        loadingSection.classList.add('hidden');
        if (error.message.includes('fetch')) {
            alert('Erro de conexão. Certifique-se de que o servidor está rodando em http://localhost:3000');
        } else {
            alert('Erro de conexão: ' + error.message);
        }
        console.error('Erro detalhado:', error);
    } finally {
        // ✅ RESTAURAR BOTÃO
        searchBtn.innerHTML = '<i class="bi bi-search"></i> Buscar';
        searchBtn.disabled = false;
    }
}

// ==================== ANIMAÇÃO DOS STEPS ====================
function animateLoadingSteps() {
    const steps = document.querySelectorAll('.step-text');
    
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

// ==================== EXIBIÇÃO DE RESULTADOS ====================
function displayMapsResults(data) {
    const tbody = document.getElementById('mapsTableBody');
    const titleElement = document.getElementById('mapsResultsTitle');
    
    if (!tbody || !titleElement) {
        console.error('Elementos da tabela não encontrados no HTML');
        return;
    }
    
    titleElement.textContent = `${data.total} estabelecimentos encontrados para "${data.termo}"`;
    
    // Limpar tabela anterior
    tbody.innerHTML = '';
    
    // Contar telefones encontrados
    let telefonesEncontrados = 0;
    
    // Preencher tabela com resultados
    data.resultados.forEach(item => {
        if (item.telefone !== 'Telefone não encontrado') {
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
    
    // Mostrar estatísticas
    if (telefonesEncontrados > 0) {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'alert alert-info mt-2';
        infoDiv.innerHTML = `📞 ${telefonesEncontrados}/${data.total} estabelecimentos com telefone encontrado`;
        titleElement.appendChild(infoDiv);
    }

    // ✅ MARCAR FERRAMENTA COMO USADA APÓS PRIMEIRO SUCESSO
    if (window.SignupSystem && data.resultados && data.resultados.length > 0) {
        SignupSystem.markAsUsed();
    }

    // ✅ ATIVAR PROTEÇÃO APÓS EXIBIR RESULTADOS
    setTimeout(() => {
        setupMapsProtection();
    }, 100);
}

// ==================== FORMATAÇÃO ====================
function formatarTelefone(telefone) {
    if (!telefone || telefone === 'Telefone não encontrado') {
        return '<span class="text-muted">Não encontrado</span>';
    }

    // Remover caracteres não numéricos
    let numeroLimpo = telefone.replace(/\D/g, '');
    
    // Remover código do país se houver
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
    if (site === 'Site não encontrado' || !site) {
        return '<span class="text-muted">Não encontrado</span>';
    }
    if (site.startsWith('http')) {
        return `<a href="${site}" target="_blank" class="text-primary"><i class="bi bi-globe"></i> Visitar</a>`;
    }
    return '<span class="text-muted">Indisponível</span>';
}

function formatarAvaliacao(avaliacao) {
    if (avaliacao === 'Sem avaliação') {
        return '<span class="text-muted">Sem avaliação</span>';
    }
    return `<span class="text-warning"><i class="bi bi-star-fill"></i> ${avaliacao}</span>`;
}

// ==================== FUNÇÕES COM VERIFICAÇÃO DE PERMISSÃO ====================
// ✅ FUNÇÃO DE EXPORTAÇÃO COM VERIFICAÇÃO
function exportarCSV() {
    // Verificar permissão ANTES de executar
    if (!checkMapsPermission()) {
        console.log('❌ Exportação CSV bloqueada - usuário precisa se cadastrar');
        return false;
    }
    
    if (!currentMapsData || currentMapsData.length === 0) {
        alert('Nenhum dado para exportar');
        return;
    }

    try {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Nome,Endereço,Telefone,Site,Avaliação,Categoria\n"
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
        
        console.log('✅ CSV exportado com sucesso');
        
    } catch (error) {
        console.error('Erro ao exportar CSV:', error);
        alert('Erro ao exportar arquivo CSV');
    }
}

// ✅ FUNÇÃO ADICIONAR AO FUNIL COM VERIFICAÇÃO
function addToFunnel(name, phone) {
    // Verificar permissão ANTES de executar
    if (!checkMapsPermission()) {
        console.log('❌ Adicionar ao funil bloqueado - usuário precisa se cadastrar');
        return false;
    }

    console.log('Adicionando ao funil:', { name, phone });
    alert(`${name} adicionado ao seu funil de leads!`);
    
    // Aqui você pode expandir para integrar com seu sistema de CRM
    // Por exemplo: salvar no localStorage, enviar para uma API, etc.
    
    // Exemplo de integração simples:
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
        
        console.log('✅ Lead adicionado ao funil local');
    } catch (error) {
        console.error('Erro ao salvar no funil:', error);
    }
}

// ==================== UTILITÁRIOS ====================
function clearMapsForm() {
    const searchTerm = document.getElementById('searchTerm');
    const maxResults = document.getElementById('maxResults');
    const resultsSection = document.getElementById('searchResults');
    
    if (searchTerm) searchTerm.value = '';
    if (maxResults) maxResults.value = '50';
    if (resultsSection) resultsSection.classList.add('hidden');
    
    currentMapsData = [];
}

function refreshMapsSearch() {
    if (currentMapsData.length > 0) {
        startMapsSearch();
    }
}

// ==================== EVENT LISTENERS ====================
function setupMapsEventListeners() {
    // Botão de busca
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', startMapsSearch);
    }
    
    // Enter no campo de busca
    const searchTerm = document.getElementById('searchTerm');
    if (searchTerm) {
        searchTerm.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                startMapsSearch();
            }
        });
    }
    
    // Botão de exportar CSV
    const exportBtn = document.getElementById('btn-csv');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportarCSV);
    }
    
    console.log('✅ Event listeners do Maps configurados');
}

// ==================== EXPORTAR FUNÇÕES GLOBAIS ====================
window.startMapsSearch = startMapsSearch;
window.exportarCSV = exportarCSV;
window.addToFunnel = addToFunnel;
window.clearMapsForm = clearMapsForm;
window.refreshMapsSearch = refreshMapsSearch;