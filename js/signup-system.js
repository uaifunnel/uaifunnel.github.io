// ==================== SISTEMA DE CADASTRO ==================== 

class SignupSystem {
    constructor() {
        this.hasUsedTool = false;
        this.isLoggedIn = false;
        this.modal = null;
        this.init();
    }

    init() {
        // Verificar se já usou a ferramenta
        this.hasUsedTool = localStorage.getItem('uaifunnel_used') === 'true';
        this.isLoggedIn = localStorage.getItem('uaifunnel_user') !== null;
        
        // Configurar event listeners
        this.setupEventListeners();
        
        console.log(`🔒 Sistema de cadastro inicializado. Usado: ${this.hasUsedTool}, Logado: ${this.isLoggedIn}`);
    }

    setupEventListeners() {
        // Aguardar DOM carregar
        document.addEventListener('DOMContentLoaded', () => {
            this.modal = document.getElementById('signupModal');
            this.setupFormHandler();
            this.setupModalClose();
        });

        // ✅ INTERCEPTAR CLIQUES ANTES DA EXECUÇÃO
        document.addEventListener('click', (e) => {
            if (this.shouldShowModal(e.target)) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation(); // Para evitar outros handlers
                this.showModal();
                return false;
            }
        }, true); // ✅ IMPORTANTE: Usar capture phase

        // Tecla ESC para fechar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal && !this.modal.classList.contains('hidden')) {
                this.hideModal();
            }
        });
    }

    setupFormHandler() {
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSignup();
            });
        }
    }

    setupModalClose() {
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-backdrop')) {
                    this.hideModal();
                }
            });
        }
    }

    shouldShowModal(element) {
        // Se já está logado, não mostrar modal
        if (this.isLoggedIn) return false;
        
        // Se ainda não usou a ferramenta, permitir uso
        if (!this.hasUsedTool) return false;

        // ✅ SELETORES MAIS ESPECÍFICOS E COMPLETOS
        const restrictedSelectors = [
            // Botões de exportar (AMBAS AS SEÇÕES)
            '#exportExcel', '#exportCSV', '#btn-csv',
            '.export-btn', '[data-export]',
            'button[onclick*="exportar"]',
            'button[onclick*="CSV"]',
            
            // Links de perfis na tabela (AMBAS AS SEÇÕES)
            'a[href*="instagram.com"]',
            'a[href*="linkedin.com"]', 
            'a[href*="facebook.com"]',
            'a[href*="maps.google.com"]',
            '.profile-link',
            
            // Botões de ação das tabelas
            '#filterBtn', '#downloadBtn',
            '.action-btn', '.download-link',
            '.btn[onclick*="addToFunnel"]',
            
            // Qualquer link externo das tabelas
            '#resultsTable a',
            '#mapsResultsTable a',
            '#mapsTableBody a',
            
            // Ações específicas do Maps
            'a[target="_blank"]'
        ];

        // ✅ VERIFICAR SE O ELEMENTO CORRESPONDE AOS SELETORES
        for (const selector of restrictedSelectors) {
            try {
                if (element.matches && element.matches(selector)) {
                    return true;
                }
                if (element.closest && element.closest(selector)) {
                    return true;
                }
            } catch (error) {
                // Ignorar seletores inválidos
                continue;
            }
        }

        // ✅ VERIFICAR ONCLICK ATTRIBUTES
        const onclickAttr = element.getAttribute('onclick');
        if (onclickAttr) {
            const restrictedOnclicks = [
                'exportarCSV', 'exportExcel', 'addToFunnel', 'exportar'
            ];
            for (const restricted of restrictedOnclicks) {
                if (onclickAttr.includes(restricted)) {
                    return true;
                }
            }
        }

        return false;
    }

    markToolAsUsed() {
        this.hasUsedTool = true;
        localStorage.setItem('uaifunnel_used', 'true');
        console.log('🎯 Ferramenta marcada como utilizada');
    }

    showModal() {
        if (!this.modal) {
            this.modal = document.getElementById('signupModal');
        }
        if (!this.modal) return;
        
        this.modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Focar no primeiro input
        setTimeout(() => {
            const firstInput = this.modal.querySelector('input[type="text"]');
            if (firstInput) firstInput.focus();
        }, 300);
        
        console.log('📋 Modal de cadastro exibido');
    }

    hideModal() {
        if (!this.modal) return;
        
        this.modal.classList.add('hidden');
        document.body.style.overflow = '';
        console.log('❌ Modal de cadastro fechado');
    }

    async handleSignup() {
        const form = document.getElementById('signupForm');
        const formData = new FormData(form);
        
        const userData = {
            name: formData.get('name').trim(),
            email: formData.get('email').trim(),
            phone: formData.get('phone').trim(),
            password: formData.get('password').trim()
        };

        // Validações básicas
        if (!this.validateSignupData(userData)) {
            return;
        }

        // Simular loading
        const submitBtn = form.querySelector('.signup-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando conta...';
        submitBtn.disabled = true;

        try {
            // Simular delay de criação de conta
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Salvar dados do usuário
            this.saveUserData(userData);
            
            // Mostrar sucesso
            this.showSuccessMessage();
            
            // ✅ MARCAR COMO LOGADO E FECHAR MODAL
            this.isLoggedIn = true;
            
            // Fechar modal após 3 segundos
            setTimeout(() => {
                this.hideModal();
            }, 3000);
            
        } catch (error) {
            console.error('Erro ao criar conta:', error);
            alert('Erro ao criar conta. Tente novamente.');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    validateSignupData(data) {
        // Validar nome
        if (data.name.length < 2) {
            alert('Nome deve ter pelo menos 2 caracteres');
            return false;
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            alert('Email inválido');
            return false;
        }

        // Validar telefone
        const phoneRegex = /[\d\s\(\)\-\+]{10,}/;
        if (!phoneRegex.test(data.phone)) {
            alert('Telefone inválido');
            return false;
        }

        // Validar senha
        if (data.password.length < 6) {
            alert('Senha deve ter pelo menos 6 caracteres');
            return false;
        }

        return true;
    }

    saveUserData(userData) {
        const userToSave = {
            ...userData,
            id: 'user_' + Date.now(),
            createdAt: new Date().toISOString(),
            plan: 'free'
        };
        
        // Não salvar senha em produção (apenas hash)
        delete userToSave.password;
        
        localStorage.setItem('uaifunnel_user', JSON.stringify(userToSave));
        console.log('💾 Dados do usuário salvos:', userToSave);
    }

    showSuccessMessage() {
        const form = document.querySelector('.signup-form');
        const successDiv = document.getElementById('signupSuccess');
        
        if (form && successDiv) {
            form.classList.add('hidden');
            successDiv.classList.remove('hidden');
        }
    }

    // ✅ MÉTODO PARA VERIFICAR PERMISSÃO ANTES DE AÇÕES
    static checkPermission() {
        if (window.signupSystem) {
            return window.signupSystem.isLoggedIn || !window.signupSystem.hasUsedTool;
        }
        return true;
    }

    // Método público para marcar ferramenta como usada
    static markAsUsed() {
        if (window.signupSystem) {
            window.signupSystem.markToolAsUsed();
        }
    }

    // Método para verificar se está logado
    static isUserLoggedIn() {
        return localStorage.getItem('uaifunnel_user') !== null;
    }
}

// Inicializar sistema
window.signupSystem = new SignupSystem();

// Exportar para uso global
window.SignupSystem = SignupSystem;