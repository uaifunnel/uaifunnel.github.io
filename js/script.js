
let navBar = document.querySelector('#header')

document.addEventListener("scroll", ()=>{
    let scrollTop = window.scrollY

    if(scrollTop > 0){
        navBar.classList.add('roll')
    } else {
        navBar.classList.remove('roll')
    }

})

// middle footer function
window.addEventListener('scroll', function() {
    const footer = document.getElementById('footer');
    const contactSection = document.getElementById('contact');

    // Verifica se a seção 'contact' está visível
    const contactTop = contactSection.offsetTop;
    const contactHeight = contactSection.offsetHeight;
    const scrollPosition = window.scrollY + window.innerHeight;

    // Verifica se o scroll chegou ao final da página OU na seção 'contact'
    if (scrollPosition >= contactTop || window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        footer.style.transform = 'translateY(0)';
    } else {
        footer.style.transform = 'translateY(100%)';
    }
});



document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetElement = document.querySelector(this.getAttribute('href'));

            // Polyfill para navegadores mais antigos
            const scrollToElement = (element) => {
                window.scrollTo({
                    top: element.offsetTop,
                    behavior: 'smooth'
                });
            };

            // Verificar se a função scrollIntoView suporta o comportamento 'smooth'
            if ('scrollBehavior' in document.documentElement.style) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            } else {
                scrollToElement(targetElement);
            }
        });
    });
});

  // Seleciona todos os links de navegação
  const menuLinks = document.querySelectorAll('nav ul li a');

  // Seleciona todas as seções que correspondem aos IDs dos links
  const sections = document.querySelectorAll('section[id]');

  // Função para remover a classe 'active' de todos os links
  function removeActiveClass() {
      menuLinks.forEach(link => {
          link.classList.remove('active');
      });
  }

  // Função para adicionar a classe 'active' ao link correspondente à seção atual
  function addActiveClass(currentSection) {
      menuLinks.forEach(link => {
          if (link.getAttribute('href') === `#${currentSection}`) {
              link.classList.add('active');
          }
      });
  }

  // Função para monitorar o scroll e identificar a seção visível
  window.addEventListener('scroll', function() {
      const scrollPosition = window.scrollY;

      // Verifica cada seção para ver se está visível
      sections.forEach(section => {
          const sectionTop = section.offsetTop - 100;  // Ajuste para quando a seção começar a aparecer
          const sectionHeight = section.offsetHeight;

          // Verifica se o scroll está dentro dos limites da seção atual
          if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
              const currentSection = section.getAttribute('id');
              removeActiveClass();  // Remove a classe de todos os links
              addActiveClass(currentSection);  // Adiciona a classe ao link da seção visível
          }
      });

      // Se o scroll estiver no topo (home), remover a classe 'active' de todos os links
      if (scrollPosition === 0) {
          removeActiveClass(); // Remove 'active' de todos os links quando estiver no topo
      }
  });


//   Multilanguage website menu
//   document.addEventListener('DOMContentLoaded', function () {
//     const dropdown = document.querySelector('.dropdownlang');
//     const menu = dropdown.querySelector('.dropdownlang-menu');
  
//     dropdown.addEventListener('mouseenter', () => {
//       menu.style.display = 'block';
//     });
  
//     dropdown.addEventListener('mouseleave', () => {
//       menu.style.display = 'none';
//     });
//   });

// Video hero play
function loadVideo(container) {
    const videoId = '9ICaItcXYMs';
    const iframe = document.createElement('iframe');
    iframe.setAttribute('width', '100%');
    iframe.setAttribute('height', '100%');
    iframe.setAttribute('src', `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&modestbranding=1&rel=0&showinfo=0`);
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'autoplay; encrypted-media');
    iframe.setAttribute('allowfullscreen', '');
    container.innerHTML = '';
    container.appendChild(iframe);
}



//   --- Arrow animatino hero section
window.addEventListener("load", function () {
    setTimeout(() => {
        const cta = document.getElementById("scroll-cta");
        if (cta) {
            cta.style.opacity = '1'; // aparece suavemente
            cta.classList.add("start-float", "start-trail"); // ativa animações
        }
    }, 2000);
});

function scrollDown() {
    window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
  }

  // Funções do Modal Tutorial
function openTutorialModal() {
    const modal = document.getElementById('tutorialModal');
    const video = document.getElementById('tutorialVideo');
    
    // URL do vídeo do YouTube (formato embed)
    const videoUrl = 'https://www.youtube.com/embed/9ICaItcXYMs?rel=0&showinfo=0&autoplay=1';
    
    // Definir a URL do vídeo
    video.src = videoUrl;
    
    // Mostrar modal
    modal.style.display = 'flex';
    
    // Prevenir scroll do body
    document.body.style.overflow = 'hidden';
    
    // Fechar modal ao clicar fora
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeTutorialModal();
        }
    });
    
    // Fechar modal com ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeTutorialModal();
        }
    });
}

// Video here section modal
function closeTutorialModal() {
    const modal = document.getElementById('tutorialModal');
    const video = document.getElementById('tutorialVideo');
    
    // Parar o vídeo
    video.src = '';
    
    // Esconder modal
    modal.style.display = 'none';
    
    // Restaurar scroll do body
    document.body.style.overflow = '';
    
    // Remover event listeners
    document.removeEventListener('keydown', closeTutorialModal);
}

// Adicionar event listener ao botão
document.getElementById('howbtn').addEventListener('click', function(e) {
    e.preventDefault();
    openTutorialModal();
});

//   --- /Arrow animatino hero section

  document.getElementById("anoAtual").textContent = new Date().getFullYear();
  document.getElementById("anoAtualz").textContent = new Date().getFullYear();
