// ✅ MAPS-INTEGRATION.JS COMPLETO - VERSÃO 5.0 FINAL COM LATITUDE E LONGITUDE
// ==================== VARIÁVEIS GLOBAIS ====================
let currentMapsData = [];

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', function() {
    setupMapsEventListeners();
    console.log('✅ Maps Integration v5.0 carregado com sucesso');
});

// ==================== CONFIGURAÇÃO DE EVENT LISTENERS ====================
function setupMapsEventListeners() {
    console.log('🔧 Configurando event listeners do Maps...');
    
    // Botão de busca
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', startMapsSearch);
        console.log('✅ Event listener do botão buscar configurado');
    }
    
    // Enter no campo de busca
    const searchTerm = document.getElementById('searchTerm');
    if (searchTerm) {
        searchTerm.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                startMapsSearch();
            }
        });
        console.log('✅ Event listener do campo busca configurado');
    }
    
    // Botão de exportar CSV
    const exportBtn = document.getElementById('btn-csv');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportarCSV);
        console.log('✅ Event listener do botão CSV configurado');
    }
}

// ==================== PROTEÇÃO DA SEÇÃO DE MAPS ====================
function setupMapsProtection() {
    const mapsSection = document.getElementById('leadMapsSection');
    if (!mapsSection) return;

    mapsSection.addEventListener('click', function(e) {
        if (shouldShowModalForMaps(e.target)) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            if (window.signupSystem && !window.signupSystem.isLoggedIn && window.signupSystem.hasUsedTool) {
                window.signupSystem.showModal();
                return false;
            }
        }
    }, true);
}

function shouldShowModalForMaps(element) {
    if (!window.signupSystem || window.signupSystem.isLoggedIn || !window.signupSystem.hasUsedTool) {
        return false;
    }

    const restrictedSelectors = [
        '#btn-csv',
        'button[onclick*="exportarCSV"]',
        'button[onclick*="exportCSV"]',
        '[data-export="csv"]',
        '#mapsTableBody a',
        '#searchResults a',
        'a[target="_blank"]',
        'a[href*="maps.google.com"]',
        'button[onclick*="addToFunnel"]',
        '.btn[onclick*="addToFunnel"]',
        '.btn-outline-primary',
        '.btn-outline-secondary',
        '#searchResults button:not(.btn-close)',
        'a[href^="tel:"]',
        '.telefone-link'
    ];

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

    const onclickAttr = element.getAttribute('onclick');
    if (onclickAttr) {
        const restrictedOnclicks = ['exportarCSV', 'exportCSV', 'addToFunnel', 'exportar', 'download'];
        for (const restricted of restrictedOnclicks) {
            if (onclickAttr.includes(restricted)) {
                return true;
            }
        }
    }

    if (element.tagName === 'A' && element.href && 
        (element.href.startsWith('http') && !element.href.includes(window.location.hostname))) {
        return true;
    }

    return false;
}

function checkMapsPermission() {
    if (window.signupSystem) {
        const hasPermission = window.signupSystem.isLoggedIn || !window.signupSystem.hasUsedTool;
        if (!hasPermission) {
            window.signupSystem.showModal();
            return false;
        }
        return true;
    }
    return true;
}

// ==================== BUSCA PRINCIPAL ====================
async function startMapsSearch() {
    console.log('🔍 Iniciando busca no Maps');
    
    const searchTerm = document.getElementById('searchTerm').value.trim();
    const maxResults = document.getElementById('maxResults').value;

    if (!searchTerm) {
        alert('Digite um termo de busca!');
        return;
    }

    const searchBtn = document.getElementById('searchBtn');
    const resultsSection = document.getElementById('searchResults');
    const loadingSection = document.getElementById('mapsLoading');

    if (loadingSection) loadingSection.classList.remove('hidden');
    if (resultsSection) resultsSection.classList.add('hidden');

    animateLoadingSteps();

    if (searchBtn) {
        searchBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Buscando...';
        searchBtn.disabled = true;
    }

    try {
        console.log('📡 Enviando requisição para API...');
        
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

        console.log('📡 Resposta recebida, status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📊 Dados processados:', data);

        if (data.sucesso) {
            currentMapsData = data.resultados;
            displayMapsResults(data);

            if (loadingSection) loadingSection.classList.add('hidden');
            if (resultsSection) resultsSection.classList.remove('hidden');
            
            console.log('✅ Busca concluída com sucesso');
        } else {
            if (loadingSection) loadingSection.classList.add('hidden');
            alert('Erro: ' + data.erro);
            console.error('❌ Erro da API:', data.erro);
        }

    } catch (error) {
        console.error('❌ Erro na requisição:', error);
        if (loadingSection) loadingSection.classList.add('hidden');
        
        if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
            alert('Erro de conexão. Verifique se o servidor backend está rodando.');
        } else {
            alert('Erro: ' + error.message);
        }
    } finally {
        if (searchBtn) {
            searchBtn.innerHTML = '<i class="bi bi-search"></i> Buscar';
            searchBtn.disabled = false;
        }
    }
}

// ==================== ANIMAÇÃO DOS STEPS ====================
function animateLoadingSteps() {
    const steps = document.querySelectorAll('.step-text');
    if (!steps.length) return;

    steps.forEach(step => {
        step.classList.remove('active');
    });

    steps.forEach((step, index) => {
        setTimeout(() => {
            step.classList.add('active');
        }, (index + 1) * 1500);
    });
}

// ==================== FORMATAÇÃO DE COORDENADAS ====================
function formatarLatitude(latitude) {
    if (!latitude || typeof latitude !== 'number' || latitude === 0) {
        return '<span class="text-muted" style="font-size: 11px;">-</span>';
    }
    
    const lat = latitude.toFixed(6);
    return `<span class="text-primary" style="font-family: monospace; font-size: 11px; font-weight: 600;">${lat}</span>`;
}

function formatarLongitude(longitude) {
    if (!longitude || typeof longitude !== 'number' || longitude === 0) {
        return '<span class="text-muted" style="font-size: 11px;">-</span>';
    }
    
    const lng = longitude.toFixed(6);
    return `<span class="text-success" style="font-family: monospace; font-size: 11px; font-weight: 600;">${lng}</span>`;
}

// ==================== FORMATAÇÃO DE OUTROS CAMPOS ====================
function formatarTelefone(telefone) {
    if (!telefone || telefone === 'Telefone não encontrado') {
        return '<span class="text-muted" style="font-size: 11px;">Não encontrado</span>';
    }

    let numeroLimpo = telefone.replace(/\D/g, '');
    
    if (numeroLimpo.startsWith('55') && numeroLimpo.length > 11) {
        numeroLimpo = numeroLimpo.substring(2);
    }
    
    if (numeroLimpo.length === 11 && numeroLimpo.startsWith('0')) {
        numeroLimpo = numeroLimpo.substring(1);
    }
    
    let telefoneFormatado = '';
    
    if (numeroLimpo.length === 11) {
        const ddd = numeroLimpo.substring(0, 2);
        const nono = numeroLimpo.substring(2, 3);
        const parte1 = numeroLimpo.substring(3, 7);
        const parte2 = numeroLimpo.substring(7, 11);
        telefoneFormatado = `(${ddd}) ${nono} ${parte1}-${parte2}`;
    } else if (numeroLimpo.length === 10) {
        const ddd = numeroLimpo.substring(0, 2);
        const parte1 = numeroLimpo.substring(2, 6);
        const parte2 = numeroLimpo.substring(6, 10);
        telefoneFormatado = `(${ddd}) ${parte1}-${parte2}`;
    } else {
        telefoneFormatado = telefone;
    }
    
    return `<a href="tel:${numeroLimpo}" class="telefone-link text-success" style="text-decoration: none; font-weight: 500; font-size: 13px;">
        <i class="bi bi-telephone-fill"></i> ${telefoneFormatado}
    </a>`;
}

function formatarSite(site) {
    if (site === 'Site não encontrado' || !site) {
        return '<span class="text-muted" style="font-size: 11px;">-</span>';
    }
    if (site.startsWith('http')) {
        return `<a href="${site}" target="_blank" class="text-primary" style="text-decoration: none; font-size: 12px;">
            <i class="bi bi-globe"></i> Visitar
        </a>`;
    }
    return '<span class="text-muted" style="font-size: 11px;">-</span>';
}

function formatarAvaliacao(avaliacao) {
    if (avaliacao === 'Sem avaliação' || !avaliacao) {
        return '<span class="text-muted" style="font-size: 11px;">-</span>';
    }
    
    const match = avaliacao.match(/(\d+[,\.]\d+)/);
    if (match) {
        const nota = parseFloat(match[0].replace(',', '.'));
        const stars = '⭐'.repeat(Math.round(nota));
        return `<span class="text-warning" title="${avaliacao}" style="font-size: 12px;">${stars} ${nota}</span>`;
    }
    
    return `<span class="text-warning" style="font-size: 12px;"><i class="bi bi-star-fill"></i> ${avaliacao}</span>`;
}

// ==================== EXIBIÇÃO DE RESULTADOS COM LATITUDE E LONGITUDE ====================
function displayMapsResults(data) {
    const tbody = document.getElementById('mapsTableBody');
    const titleElement = document.getElementById('mapsResultsTitle');
    
    if (!tbody || !titleElement) {
        console.error('❌ Elementos da tabela não encontrados no HTML');
        return;
    }
    
    console.log('📋 Exibindo resultados na tabela...');
    
    titleElement.textContent = `${data.total} estabelecimentos encontrados para "${data.termo}"`;
    
    tbody.innerHTML = '';
    
    let telefonesEncontrados = 0;
    let coordenadasEncontradas = 0;
    let sitesEncontrados = 0;
    
    data.resultados.forEach(item => {
        if (item.telefone !== 'Telefone não encontrado') {
            telefonesEncontrados++;
        }
        if (item.site !== 'Site não encontrado') {
            sitesEncontrados++;
        }
        if (item.latitude && item.longitude && 
            typeof item.latitude === 'number' && typeof item.longitude === 'number' &&
            item.latitude !== 0 && item.longitude !== 0) {
            coordenadasEncontradas++;
        }

        const row = tbody.insertRow();
        
        // ✅ ROW COM TODAS AS 10 COLUNAS (INCLUINDO LATITUDE E LONGITUDE)
        row.innerHTML = `
            <td style="text-align: center; font-weight: 600; color: #053B49;">${item.indice}</td>
            <td style="font-weight: 500; color: #053B49; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${item.nome || 'Nome não encontrado'}
            </td>
            <td style="font-size: 12px; color: #757575; max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${item.endereco || 'Endereço não encontrado'}
            </td>
            <td style="text-align: center;">
                ${formatarTelefone(item.telefone)}
            </td>
            <td style="text-align: center;">
                ${formatarSite(item.site)}
            </td>
            <td style="text-align: center;">
                ${formatarAvaliacao(item.avaliacao)}
            </td>
            <td style="font-size: 12px; color: #757575; max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${item.categoria || 'Categoria não encontrada'}
            </td>
            <td style="text-align: center; padding: 8px;">
                ${formatarLatitude(item.latitude)}
            </td>
            <td style="text-align: center; padding: 8px;">
                ${formatarLongitude(item.longitude)}
            </td>
            <td style="text-align: center;">
                <div class="btn-group btn-group-sm" style="gap: 4px;">
                    <button class="btn btn-outline-primary btn-sm" 
                            onclick="addToFunnel('${item.nome.replace(/'/g, "\\'")}', '${item.telefone}')" 
                            style="font-size: 11px; padding: 4px 10px;">
                        <i class="bi bi-plus-circle"></i> Add
                    </button>
                    <a href="${item.link}" target="_blank" 
                       class="btn btn-outline-secondary btn-sm" 
                       style="font-size: 11px; padding: 4px 10px;">
                        <i class="bi bi-geo-alt-fill"></i> Ver
                    </a>
                </div>
            </td>
        `;
    });
    
    exibirEstatisticasDetalhadas(data.total, telefonesEncontrados, coordenadasEncontradas, sitesEncontrados);

    if (window.signupSystem && data.resultados && data.resultados.length > 0) {
        window.signupSystem.markToolAsUsed();
        console.log('🎯 Ferramenta marcada como utilizada');
    }

    setTimeout(() => {
        setupMapsProtection();
    }, 100);
    
    console.log('✅ Resultados exibidos com sucesso');
    console.log(`📞 Telefones encontrados: ${telefonesEncontrados}/${data.total}`);
    console.log(`📍 Coordenadas encontradas: ${coordenadasEncontradas}/${data.total} (${((coordenadasEncontradas/data.total)*100).toFixed(1)}%)`);
    console.log(`🌐 Sites encontrados: ${sitesEncontrados}/${data.total}`);
}

// ==================== ESTATÍSTICAS DETALHADAS ====================
function exibirEstatisticasDetalhadas(total, telefones, coordenadas, sites) {
    let statsElement = document.getElementById('mapsStatistics');
    
    if (!statsElement) {
        const resultsSection = document.getElementById('searchResults');
        if (resultsSection) {
            statsElement = document.createElement('div');
            statsElement.id = 'mapsStatistics';
            statsElement.style.cssText = `
                margin: 20px 0;
                padding: 20px;
                background: transparent;
                border-radius: 15px;
                border: 1px solid #d83e4c;
                display: flex;
                justify-content: space-around;
                flex-wrap: wrap;
                gap: 20px;
                color: white;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            `;
            resultsSection.insertBefore(statsElement, resultsSection.firstChild);
        }
    }

    const percentualTelefones = total > 0 ? ((telefones / total) * 100).toFixed(1) : 0;
    const percentualCoordenadas = total > 0 ? ((coordenadas / total) * 100).toFixed(1) : 0;
    const percentualSites = total > 0 ? ((sites / total) * 100).toFixed(1) : 0;

    if (statsElement) {
        statsElement.innerHTML = `
            <div style="text-align: center; color: #3e3e3e; min-width: 120px;">
                <div style="font-size: 32px; font-weight: 700; color: #d83e4c; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">${total}</div>
                <div style="font-size: 13px; opacity: 0.95; margin-top: 5px;">Estabelecimentos</div>
            </div>
            <div style="text-align: center; color: #3e3e3e; min-width: 120px;">
                <div style="font-size: 32px; font-weight: 700; color: #28a745; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">${telefones}</div>
                <div style="font-size: 13px; opacity: 0.95; margin-top: 5px;">📱 Telefones (${percentualTelefones}%)</div>
            </div>
            <div style="text-align: center; color: #3e3e3e; min-width: 120px;">
                <div style="font-size: 32px; font-weight: 700; color: #ffc107; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">${coordenadas}</div>
                <div style="font-size: 13px; opacity: 0.95; margin-top: 5px;">📍 Coordenadas (${percentualCoordenadas}%)</div>
            </div>
            <div style="text-align: center; color: #3e3e3e; min-width: 120px;">
                <div style="font-size: 32px; font-weight: 700; color: #17a2b8; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">${sites}</div>
                <div style="font-size: 13px; opacity: 0.95; margin-top: 5px;">🌐 Sites (${percentualSites}%)</div>
            </div>
        `;
    }
}

// ==================== EXPORTAÇÃO CSV COM COORDENADAS ====================
function exportarCSV() {
    console.log('📄 Tentativa de exportação CSV');
    
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
            + "Nome,Endereço,Telefone,Latitude,Longitude,Site,Avaliação,Categoria,Link Maps\n"
            + currentMapsData.map(item => 
                `"${item.nome || ''}","${item.endereco || ''}","${item.telefone || ''}","${item.latitude || ''}","${item.longitude || ''}","${item.site || ''}","${item.avaliacao || ''}","${item.categoria || ''}","${item.link || ''}"`
            ).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `estabelecimentos_coordenadas_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ CSV exportado com sucesso');
        showNotification('✅ CSV exportado com coordenadas!', 'success');
        
    } catch (error) {
        console.error('❌ Erro ao exportar CSV:', error);
        alert('Erro ao exportar arquivo CSV');
    }
}

// ==================== ADICIONAR AO FUNIL ====================
function addToFunnel(name, phone) {
    console.log('📋 Tentativa de adicionar ao funil:', name);
    
    if (!checkMapsPermission()) {
        console.log('❌ Adicionar ao funil bloqueado - usuário precisa se cadastrar');
        return false;
    }

    console.log('✅ Adicionando ao funil:', { name, phone });
    
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
        showNotification(`✅ ${name} adicionado ao funil!`, 'success');
    } catch (error) {
        console.error('❌ Erro ao salvar no funil:', error);
        showNotification('❌ Erro ao adicionar ao funil', 'error');
    }
}

// ==================== NOTIFICAÇÕES ====================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        font-weight: 500;
        font-size: 14px;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
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
    console.log('🧹 Formulário Maps limpo');
}

// ==================== EXPORTAR FUNÇÕES GLOBAIS ====================
window.startMapsSearch = startMapsSearch;
window.exportarCSV = exportarCSV;
window.addToFunnel = addToFunnel;
window.clearMapsForm = clearMapsForm;

// ==================== VERIFICAÇÃO FINAL ====================
console.log('✅ Maps Integration v5.0 carregado completamente');
console.log('📍 Funcionalidades ativas:');
console.log(' - ✅ Latitude e Longitude em colunas separadas');
console.log(' - ✅ Formatação com 6 casas decimais');
console.log(' - ✅ Validação de coordenadas (não mostra 0,0)');
console.log(' - ✅ Estatísticas com percentual de coordenadas');
console.log(' - ✅ Exportação CSV com lat/lng separados');
console.log(' - ✅ Sistema de proteção integrado');
console.log(' - ✅ URL Ngrok configurada');
console.log(' - ✅ Notificações visuais');
console.log(' - ✅ Todas as 10 colunas da tabela');

