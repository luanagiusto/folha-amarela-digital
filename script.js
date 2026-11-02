// CHAVE DA API GEMINI AQUI (SE APLICÁVEL, PARA BUSCA HÍBRIDA)
        const GEMINI_API_KEY = '';

        const firebaseConfig = {
            apiKey: "AIzaSyBxv7AWrRep8yRJyEK90nXgpEmO1zOfd8o",
            authDomain: "folha-amarela-digital.firebaseapp.com",
            projectId: "folha-amarela-digital",
            storageBucket: "folha-amarela-digital.firebasestorage.app",
            messagingSenderId: "377984429498",
            appId: "1:377984429498:web:0ec71abadab20a93420183"
        };
        firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();
        const db = firebase.firestore();

        let cidadeAtual = 'Paraisópolis', categoriaAtual = '', bairroAtual = '';
        let listaLocaisCache = [];
        let usuarioLogado = null, modoCadastroAcesso = false, localAtualDetalhes = null;
        let meusLocaisCache = [], interessesCache = [], painelAba = 'meus';
        let unsubPainel = [];
        let isAdminLogado = false;
        let paginaAtual = 1;
        const ITENS_POR_PAGINA = 20;

        const RELATED_TERMS = {
            eletricista:['eletrica','instalacao eletrica','tomada','chuveiro','fiacao','energia'],
            eletrica:['eletricista','instalacao eletrica','tomada','chuveiro'],
            costureira:['costura','ajuste de roupa','barra','conserto de roupa','costureiro'],
            costura:['costureira','costureiro','ajuste de roupa','barra'],
            faxina:['diarista','limpeza','domestica','limpeza residencial'],
            diarista:['faxina','limpeza','domestica','limpeza residencial'],
            pedreiro:['obra','construcao','reforma','alvenaria'],
            pintor:['pintura','pintura residencial','reforma'],
            jardineiro:['jardinagem','jardim','poda','gramado'],
            mecanico:['oficina','carro','automovel','manutencao'],
            celular:['assistencia tecnica','telefone','smartphone','conserto'],
            computador:['informatica','notebook','assistencia tecnica','pc'],
            cabeleireiro:['salao','cabelo','cabeleireira','barbeiro'],
            barbeiro:['barbearia','cabelo','corte masculino'],
            unha:['manicure','pedicure','nail designer'],
            bolo:['confeitaria','doces','bolos','salgados'],
            comida:['alimentacao','restaurante','marmita','lanchonete'],
            pet:['pet shop','veterinario','banho e tosa','animais'],
            veterinario:['veterinario','pet','animais','clinica veterinaria']
        };

        // --- FUNÇÕES DO MENU LATERAL ---
        function toggleMenu() {
            const drawer = document.getElementById('navDrawer');
            const overlay = document.getElementById('navOverlay');
            drawer.classList.toggle('open');
            overlay.classList.toggle('open');
            
            // Sincroniza a imagem da logo do menu com o tema atual
            const logoMain = document.getElementById('logoImg');
            const logoMenu = document.getElementById('logoImgMenu');
            if (logoMain && logoMenu && logoMain.dataset.broken !== 'true') {
                 logoMenu.src = logoMain.src;
            } else if (logoMenu) {
                logoMenu.style.display = 'none';
            }
        }

        function normalizarTexto(v){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();}
        function limparWhatsApp(v){return String(v??'').replace(/\D/g,'');}
        function abrirWhatsApp(numero,mensagem=''){let n=limparWhatsApp(numero);if(!n)return;if(n.startsWith('55')&&(n.length===12||n.length===13))n=n.slice(2);if(n.length<10||n.length>11){alert('Este perfil ainda não tem um número de WhatsApp válido.');return;}window.open(`https://wa.me/55${n}${mensagem?'?text='+encodeURIComponent(mensagem):''}`,'_blank','noopener,noreferrer');}
        
        function mostrarLogoFallback(){const i=document.getElementById('logoImg'),f=document.getElementById('logoFallback');if(i){i.dataset.broken='true';i.style.display='none';}if(f)f.style.display='flex';}
        function atualizarLogoTema(dark){
            const i=document.getElementById('logoImg');
            if(i&&i.dataset.broken!=='true') i.src=dark?'header_dark.png':'header_light.png';
            const m=document.getElementById('logoImgMenu');
            if(m&&i&&i.dataset.broken!=='true') m.src=dark?'header_dark.png':'header_light.png';
        }
        function carregarTemaSalvo(){
            const t=localStorage.getItem('folha_theme');
            if(t==='dark'){
                document.body.classList.add('dark-mode');
                document.getElementById('themeIcon').className='fas fa-sun';
                const themeMenu = document.getElementById('themeIconMenu');
                if(themeMenu) themeMenu.className='fas fa-sun';
                atualizarLogoTema(true);
            } else {
                atualizarLogoTema(false);
            }
        }
        
        function toggleTheme(){
            document.body.classList.toggle('dark-mode');
            const d=document.body.classList.contains('dark-mode');
            localStorage.setItem('folha_theme',d?'dark':'light');
            document.getElementById('themeIcon').className=d?'fas fa-sun':'fas fa-moon';
            const themeMenu = document.getElementById('themeIconMenu');
            if(themeMenu) themeMenu.className=d?'fas fa-sun':'fas fa-moon';
            atualizarLogoTema(d);
        }
        carregarTemaSalvo();

        auth.onAuthStateChanged(async user=>{
            usuarioLogado=user;isAdminLogado=false;
            if(user){
                try{const token=await user.getIdTokenResult(true);isAdminLogado=token.claims.admin===true;}
                catch(e){console.error('Não foi possível validar a Custom Claim admin:',e);}
            }
            const b=document.getElementById('txtBtnAcesso');
            if(b)b.textContent=user?(isAdminLogado?'Painel Admin':'O Meu Painel'):'Área de acesso';
            if(!user){fecharPainel();} else if(document.getElementById('modalPainel').style.display==='block'){abrirPainel();}
        });

       function voltarInicio(){
            cidadeAtual=document.getElementById('cidadeAtivaHeader').textContent||'Paraisópolis';
            categoriaAtual='';bairroAtual='';
            document.getElementById('inputBusca').value='';
            document.querySelectorAll('.cat-item').forEach(x=>x.classList.remove('active'));
            const t=document.querySelector('#secaoTabServicos .cat-item:last-child');
            if(t)t.classList.add('active');
            paginaAtual = 1;
            renderizarLocais();
            window.scrollTo({top:0,behavior:'smooth'});
        }
              
     
        function abrirModalEscolhaAnuncio(){document.getElementById('modalEscolhaAnuncio').style.display='block';}
        function abrirModalCadastroServico(fecharEscolha=true){if(fecharEscolha)document.getElementById('modalEscolhaAnuncio').style.display='none';                                                                document.getElementById('cadCidade').value=cidadeAtual; document.getElementById('modalCadastro').style.display='block';}
        
      
        function fecharModalCadastro(){document.getElementById('modalCadastro').style.display='none';}
        
     
        function registroAprovado(x){return x.status==='aprovado'||x.status==='ativo';}
        function registroDestaque(x){return x.destaque===true||x.plano==='destaque'||x.plano==='premium';}
        function ordenarLocais(a){return [...a].sort((x,y)=>Number(registroDestaque(y))-Number(registroDestaque(x)));}
         function formatarNomeExibicao(texto) {
            if (!texto) return 'Prestador local';
    
            // 1. Remove números, pontos e traços do início (ex: "65.354.050 ")
            let nomeLimpo = texto.replace(/^[\d.\-\s]+/, '').trim();
            if (!nomeLimpo) return 'Prestador local';

            // 2. Converte para Title Case, mantendo preposições em minúsculas
            const excecoes = ['da', 'de', 'do', 'das', 'dos', 'e', 'em', 'na', 'no'];
            return nomeLimpo.toLowerCase().split(/\s+/).map((palavra, index) => {
                if (excecoes.includes(palavra) && index !== 0) {
                    return palavra;
                }
                return palavra.charAt(0).toUpperCase() + palavra.slice(1);
            }).join(' ');
                }

        function nomeExibicaoLocal(l) {
            const nomeBruto = String(l.nomeFantasia || l.nome_fantasia || l.fantasia || l.nomeComercial || l.nome || 'Prestador local').trim();
            return formatarNomeExibicao(nomeBruto);
        }
        function cnpjFormatado(valor){const n=String(valor||'').replace(/\D/g,'');return n.length===14?n.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,'$1.$2.$3/$4-$5'):String(valor||'').trim();}
        function descricaoCurtaLocal(l){const texto=String(l.descricao||l.servicos||'').replace(/\s+/g,' ').trim();return texto.length>145?texto.slice(0,142).trimEnd()+'…':texto;}
        function textoLocal(l){return normalizarTexto([nomeExibicaoLocal(l),l.nome,l.categoria,l.subcategoria,l.descricao,l.servicos,l.keywords,l.palavrasChave,l.bairro,l.cidade,l.telefone].join(' '));}
        function textoImovel(i){return normalizarTexto([i.titulo,i.transacao,i.tipo,i.descricao,i.bairro,i.cidade,i.quartos,i.garagem?'garagem estacionamento vaga':''].join(' '));}
        function termosBusca(q){const p=normalizarTexto(q).split(/\s+/).filter(Boolean),e=[];p.forEach(x=>{if(RELATED_TERMS[x])e.push(...RELATED_TERMS[x]);});return [...new Set([...p,...e])];}
        function combina(item,imovel,q){const base=normalizarTexto(q);if(!base)return true;const h=imovel?textoImovel(item):textoLocal(item),p=base.split(/\s+/).filter(Boolean);if(p.every(x=>h.includes(x)))return true;return termosBusca(q).some(x=>x.length>=3&&h.includes(normalizarTexto(x)));}
        
        function filtrarLocaisCache(){
            const q=document.getElementById('inputBusca').value;
            let a=ordenarLocais(listaLocaisCache.filter(registroAprovado).filter(l=>normalizarTexto(l.cidade||'Paraisópolis')===normalizarTexto(cidadeAtual)));
            if(categoriaAtual)a=a.filter(l=>normalizarTexto(l.categoria)===normalizarTexto(categoriaAtual));
            if(bairroAtual)a=a.filter(l=>normalizarTexto(l.bairro)===normalizarTexto(bairroAtual));
            if(q.trim())a=a.filter(l=>combina(l,false,q));
            return a;
        }
        function filtrarImoveisCache(){
            const q=document.getElementById('inputBusca').value;
            let a=listaImoveisCache.filter(registroAprovado).filter(i=>normalizarTexto(i.cidade||'Paraisópolis')===normalizarTexto(cidadeAtual));
            if(transacaoImovelAtual)a=a.filter(i=>normalizarTexto(i.transacao)===normalizarTexto(transacaoImovelAtual));
            if(bairroAtual)a=a.filter(i=>normalizarTexto(i.bairro)===normalizarTexto(bairroAtual));
            if(q.trim())a=a.filter(i=>combina(i,true,q));
            return a;
        }
        
        function criarEl(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
        function icone(cls){const e=document.createElement('i');e.className=cls;return e;}
        function botaoWpp(n,label,msg){const b=criarEl('button','btn-card btn-wpp');b.type='button';b.append(icone('fab fa-whatsapp'),document.createTextNode(` ${label}`));b.addEventListener('click',()=>abrirWhatsApp(n,msg));return b;}

       function atualizarMetaBusca(n){
            const m=document.getElementById('searchMeta'),q=document.getElementById('inputBusca').value.trim();
            if(m)m.textContent=q?`${n} resultado(s) encontrado(s).`:'';
        }
        
   
async function renderizarLocais(){
            const a = filtrarLocaisCache(), c = document.getElementById('listaLocais');
            const q = document.getElementById('inputBusca').value.trim();
            let secaoWeb = document.getElementById('secaoResultadosWeb');
            c.replaceChildren();
            
            if(!a.length){
                c.appendChild(criarVazio(false));
                atualizarMetaBusca(0);
                renderizarPaginacao(0);
                if(q.length >= 3 && typeof GEMINI_API_KEY !== 'undefined' && GEMINI_API_KEY) {
                    buscarComGemini(q);
                } else if(secaoWeb) {
                    secaoWeb.style.display = 'none';
                }
                return;
            }
               
            if(secaoWeb) secaoWeb.style.display = 'none';      

            const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
            const fim = inicio + ITENS_POR_PAGINA;
            const itensPagina = a.slice(inicio, fim);
            
            itensPagina.forEach(l => {
                const card = criarEl('article', 'card-local');
                if(registroDestaque(l)) card.classList.add('is-featured');
                const body = criarEl('div', 'card-body');
                if(registroDestaque(l)){const sponsored = criarEl('div', 'featured-badge', '★ Patrocinado'); body.appendChild(sponsored);}
                
                const top = criarEl('div', 'card-topline');
                const title = criarEl('div', 'card-title', nomeExibicaoLocal(l));
                top.appendChild(title);
                body.appendChild(top);
                
                const meta = criarEl('div', 'card-subtitle'), catMeta = criarEl('span'), bairroMeta = criarEl('span');
                catMeta.append(icone('fas fa-tag'), document.createTextNode(' ' + (l.categoria || 'Serviço')));
                bairroMeta.append(icone('fas fa-location-dot'), document.createTextNode(' ' + (l.bairro || 'Centro')));
                meta.append(catMeta, bairroMeta); body.appendChild(meta);
                
                if(l.descricao || l.servicos) body.appendChild(criarEl('p', 'card-description', descricaoCurtaLocal(l)));
                if(l.keywords || l.palavrasChave) body.appendChild(criarEl('div', 'card-keywords', `Encontre por: ${l.keywords || l.palavrasChave}`));
                
                const acts = criarEl('div', 'card-actions');
                
                // Botão de WhatsApp posicionado corretamente dentro do loop
                if(l.whatsapp || l.telefone) {
                    const nomeLoc = nomeExibicaoLocal(l);
                    const bairroLoc = l.bairro || 'Centro';
                    const cidadeLoc = l.cidade || cidadeAtual;
                    const msgWpp = `Olá! Vi *${nomeLoc}* na Folha Amarela Digital (📍 ${bairroLoc}, ${cidadeLoc}) e gostaria de mais informações.\n\nPerfil: ${location.origin}/perfil.html?id=${l.idDoc}`;
                    acts.appendChild(botaoWpp(l.whatsapp || l.telefone, 'WhatsApp', msgWpp));
                }

                // CORRIJA ESTA LINHA EM renderizarLocais():
                const detail = criarEl('button', 'btn-card btn-outline', 'Detalhes');
                detail.type = 'button'; 
                detail.onclick = () => abrirDetalhesLocal(l.idDoc);
                acts.appendChild(detail);
                
                body.appendChild(acts);
                card.appendChild(body);
                c.appendChild(card);
            });
            
            atualizarMetaBusca(a.length);
            renderizarPaginacao(a.length);
        }

         // NOVA FUNÇÃO
        function renderizarPaginacao(totalItens) {
            const container = document.getElementById('paginacaoLocais');
            if(!container) return;
            container.replaceChildren();

            const totalPaginas = Math.ceil(totalItens / ITENS_POR_PAGINA);
            if(totalPaginas <= 1) return; // Não exibe se houver apenas 1 página

            for(let i = 1; i <= totalPaginas; i++) {
                const btn = criarEl('button', 'btn-page', String(i));
                if(i === paginaAtual) btn.classList.add('active');
                btn.onclick = () => {
                    paginaAtual = i;
                    renderizarLocais();
                    document.getElementById('secaoTabServicos').scrollIntoView({behavior: 'smooth', block: 'start'});
                };
                container.appendChild(btn);
            }
        }                       

        async function buscarComGemini(termo) {
            let secaoWeb = document.getElementById('secaoResultadosWeb');
            let containerWeb = document.getElementById('listaLocaisWeb');
            if(!secaoWeb || !containerWeb) return;
            
            secaoWeb.style.display = 'block';
            containerWeb.innerHTML = '<p style="text-align:center; padding:20px; color:var(--purple);"><i class="fas fa-spinner fa-spin"></i> A procurar na web com IA...</p>';

            const prompt = `Aja como um assistente de diretório local. Busque estabelecimentos comerciais na cidade de ${cidadeAtual}, Minas Gerais, correspondentes a "${termo}". Retorne APENAS um array JSON válido, sem formatação markdown, com até 3 resultados. Estrutura exigida: [{"n": "Nome do Local", "c": "Categoria sugerida", "e": "Endereço ou Bairro resumido"}].`;

            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });
                
                const data = await response.json();
                let textoIA = data.candidates[0].content.parts[0].text;
                textoIA = textoIA.replace(/```json|```/g, '').trim();
                const resultados = JSON.parse(textoIA);

                if (resultados.length > 0) {
                    containerWeb.innerHTML = '';
                    resultados.forEach(res => {
                        containerWeb.innerHTML += `
                            <div class="card-local" style="border-left: 4px solid var(--purple);">
                                <div class="card-body">
                                    <div class="card-title">${res.n}</div>
                                    <div class="card-subtitle"><i class="fas fa-globe"></i> ${res.c} &bull; <i class="fas fa-map-marker-alt"></i> ${res.e}</div>
                                    <div class="card-actions" style="margin-top: 14px;">
                                        <button class="btn-card" style="background: var(--purple); color: white;" onclick="reivindicarLocal('${res.n}', '${res.c}')">
                                            <i class="fas fa-bullhorn"></i> É dono? Anuncie Grátis!
                                        </button>
                                    </div>
                                </div>
                            </div>`;
                    });
                } else {
                    containerWeb.innerHTML = '<p style="text-align:center; color:var(--gray);">Nenhum resultado externo encontrado.</p>';
                }
            } catch (error) {
                console.error("Erro no Gemini:", error);
                containerWeb.innerHTML = '<p style="text-align:center; color:var(--danger);">Não foi possível conectar à pesquisa da web. Verifique se a chave de API é válida.</p>';
            }
        }
        
        function reivindicarLocal(nome, categoria) {
            document.getElementById('cadNome').value = nome;
            let selectCat = document.getElementById('cadCategoria');
            let opcaoExiste = Array.from(selectCat.options).some(opt => opt.value === categoria);
            if(opcaoExiste) selectCat.value = categoria;
            abrirModalCadastroServico();
        }

function abrirDetalhesLocal(id){
            const l=listaLocaisCache.find(x=>x.idDoc===id);
            if(!l)return;
            
            const badge=document.getElementById('detLocalBadge');badge.replaceChildren();
            if(registroDestaque(l))badge.appendChild(criarEl('div','featured-badge','★ Em destaque'));
            
            document.getElementById('detLocalNome').textContent=nomeExibicaoLocal(l);
            document.getElementById('detLocalCategoria').textContent=l.categoria||'Serviço';
            
            const elBairro = document.getElementById('detLocalLocal');
            const elEnd = document.getElementById('detLocalEnderecoCompleto');
            
            if (l.endereco) {
                elBairro.style.display = 'none';
                elEnd.style.display = 'flex';
                elEnd.querySelector('span').textContent = `${l.endereco} - ${l.bairro||'Centro'}, ${l.cidade||cidadeAtual}`;
            } else {
                elEnd.style.display = 'none';
                elBairro.style.display = 'flex';
                elBairro.querySelector('span').textContent = `${l.bairro||'Centro'}, ${l.cidade||cidadeAtual}`;
            }

            const elHorario = document.getElementById('detLocalHorario');
            if (l.horario) { 
                elHorario.style.display = 'flex'; 
                elHorario.querySelector('span').textContent = l.horario; 
            } else { 
                elHorario.style.display = 'none'; 
            }

            document.getElementById('detLocalDescricao').textContent=l.descricao||l.servicos||'Este perfil ainda não possui uma descrição detalhada.';
            
            const elKeywords = document.getElementById('detLocalKeywords');
            if(l.keywords||l.palavrasChave) {
                elKeywords.style.display = 'block';
                elKeywords.textContent = `Encontre por: ${l.keywords||l.palavrasChave}`;
            } else {
                elKeywords.style.display = 'none';
            }
            
            // Botões de Ação
            const btnWpp = document.getElementById('btnDetLocalWpp');
            btnWpp.style.display=(l.whatsapp||l.telefone)?'flex':'none';
          const nomeLoc = nomeExibicaoLocal(l);
        const bairroLoc = l.bairro || 'Centro';
        const cidadeLoc = l.cidade || cidadeAtual;
        const msgWppModal = `Olá! Vi *${nomeLoc}* na Folha Amarela Digital (📍 ${bairroLoc}, ${cidadeLoc}) e gostaria de mais informações.\n\nPerfil: ${location.origin}/perfil.html?id=${l.idDoc}`;
btnWpp.onclick = () => abrirWhatsApp(l.whatsapp||l.telefone, msgWppModal);
            
            const btnTel = document.getElementById('btnDetLocalTel');
            if (l.telefoneExtra) {
                btnTel.style.display='flex';
                btnTel.onclick=()=>window.open(`tel:${l.telefoneExtra}`, '_self');
            } else { btnTel.style.display='none'; }

        const btnCompleto = document.getElementById('btnDetPerfilCompleto');
        if(btnCompleto) {
            btnCompleto.style.display = 'flex';
            btnCompleto.onclick = () => {
                window.location.href = `perfil.html?id=${l.idDoc}`;
            };
        }
        
            const btnInsta = document.getElementById('btnDetLocalInsta');
            if (l.instagram) {
                btnInsta.style.display='flex';
                const userInsta = l.instagram.replace('@', '').trim();
                btnInsta.onclick=()=>window.open(`https://instagram.com/${userInsta}`, '_blank');
            } else { btnInsta.style.display='none'; }

            const btnMapa = document.getElementById('btnDetLocalMapa');
            if (l.endereco || l.bairro) {
                btnMapa.style.display='flex';
                const queryMapa = l.endereco ? `${l.endereco}, ${l.cidade||cidadeAtual}` : `${nomeExibicaoLocal(l)}, ${l.bairro||'Centro'}, ${l.cidade||cidadeAtual}`;
                btnMapa.onclick=()=>window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryMapa)}`, '_blank');
            } else { btnMapa.style.display='none'; }

            document.getElementById('modalDetalhesLocal').style.display='block';
        }
        function fecharDetalhesLocal(){document.getElementById('modalDetalhesLocal').style.display='none';localAtualDetalhes=null;}
        
      
        
        function abrirDestaqueLocalAtual(){
            if(!localAtualDetalhes)return;
            if(!usuarioLogado){alert('Entre na sua conta para solicitar destaque.');fecharDetalhesLocal();modoCadastroAcesso=false;atualizarModalAcesso();document.getElementById('modalAreaAcesso').style.display='block';return;}
            if(localAtualDetalhes.proprietarioUid!==usuarioLogado.uid){alert('Primeiro reivindique e tenha a gestão deste perfil aprovada.');return;}
            document.getElementById('destaqueNomeLocal').textContent=localAtualDetalhes.nome||'Negócio';
            document.getElementById('destaqueEmail').value=usuarioLogado.email||'';
            document.getElementById('destaqueWpp').value='';
            document.getElementById('destaqueMensagem').textContent='';
            document.getElementById('modalDestaque').style.display='block';
        }
        function fecharModalDestaque(){document.getElementById('modalDestaque').style.display='none';}
        async function enviarInteresseDestaque(){
            const msg=document.getElementById('destaqueMensagem'),email=document.getElementById('destaqueEmail').value.trim(),wpp=limparWhatsApp(document.getElementById('destaqueWpp').value);
            if(!email&&!wpp){msg.textContent='Informe pelo menos um e-mail ou WhatsApp.';return;}
            if(!localAtualDetalhes){msg.textContent='Perfil não encontrado.';return;}
            msg.textContent='Enviando...';
            try{
                await db.collection('interessesDestaque').add({localId:localAtualDetalhes.idDoc,nomeLocal:localAtualDetalhes.nome||'',email,whatsapp:wpp,userId:usuarioLogado?usuarioLogado.uid:'',status:'novo',criadoEm:firebase.firestore.FieldValue.serverTimestamp()});
                msg.textContent='Recebemos seu interesse!';
            }catch(e){console.error(e);msg.textContent='Erro ao enviar. Verifique o Firestore.';}
        }

     

        function filtrarCategoria(cat,el){document.querySelectorAll('#secaoTabServicos .cat-item').forEach(e=>e.classList.remove('active'));el.classList.add('active');categoriaAtual=cat; paginaAtual = 1; renderizarLocais();}

      function filtrarBusca(){paginaAtual = 1; renderizarLocais();}
        
        function abrirModalCidade(){document.getElementById('modalCidade').style.display='block';}
        function fecharModalCidade(){document.getElementById('modalCidade').style.display='none';}
    function mudarCidade(c){cidadeAtual=c;document.getElementById('cidadeAtivaHeader').textContent=c;fecharModalCidade();bairroAtual='';atualizarListaBairros(); paginaAtual = 1; renderizarLocais();}
        
       function atualizarSeletorCidades() {
    const cidades = [...new Set([...listaLocaisCache.map(x => (x.cidade || 'Paraisópolis').trim())].filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    
    const datalist = document.getElementById('listaCidadesDatalist');
    if (datalist) {
        datalist.replaceChildren();
        cidades.forEach(c => {
            const option = document.createElement('option');
            option.value = c; // Mostra a sugestão à medida que o utilizador digita
            datalist.appendChild(option);
        });
    }
}

// Dispara a busca quando o utilizador clica em Confirmar ou prime Enter
function confirmarCidadeInput() {
    const input = document.getElementById('inputBuscaCidade');
    const cidade = input.value.trim();
    if (cidade) {
        mudarCidade(cidade);
        input.value = ''; // Limpa o campo para a próxima utilização
    } else {
        alert('Por favor, digite o nome da cidade.');
        input.focus();
    }
}
        
       function atualizarListaBairros(){
            const s=document.getElementById('filtroBairro');
            const bs=[...new Set(listaLocaisCache.filter(x=>normalizarTexto(x.cidade||'Paraisópolis')===normalizarTexto(cidadeAtual)&&x.bairro).map(x=>String(x.bairro).trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
            const v=bairroAtual;s.replaceChildren(new Option('Todos os Bairros',''));
            bs.forEach(b=>s.appendChild(new Option(b,b)));
            if(bs.includes(v)){s.value=v;bairroAtual=v;}else{s.value='';bairroAtual='';}
        }
       function filtrarBairro(){bairroAtual=document.getElementById('filtroBairro').value;paginaAtual = 1; renderizarLocais();}
        
       function usarGPSLocalizacao(){
            if(!navigator.geolocation) return alert('O seu navegador não disponibiliza localização.');
            
            const btn = document.querySelector('button[onclick="usarGPSLocalizacao()"]');
            const textoOriginal = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A procurar...';
            btn.disabled = true;

            navigator.geolocation.getCurrentPosition(async (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                
                try {
                    // Consulta gratuita ao OpenStreetMap para obter a cidade via coordenadas
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                    const data = await res.json();
                    
                    const cidadeEncontrada = data.address.city || data.address.town || data.address.village;
                    
                    if (cidadeEncontrada) {
                        const cidadeNormalizada = normalizarTexto(cidadeEncontrada);
                        
                        // Verifica se a cidade encontrada já existe na nossa base (ignorando acentos)
                        const cidadeExistente = [...new Set(listaLocaisCache.map(x => (x.cidade || 'Paraisópolis').trim()))]
                            .find(c => normalizarTexto(c) === cidadeNormalizada);

                        if (cidadeExistente) {
                            mudarCidade(cidadeExistente);
                        } else {
                            mudarCidade(cidadeEncontrada);
                            alert(`Localização encontrada: ${cidadeEncontrada}. Ainda pode não haver locais registados aqui.`);
                        }
                    } else {
                        alert('Não foi possível identificar a cidade através destas coordenadas.');
                    }
                } catch (e) {
                    console.error("Erro na geocodificação:", e);
                    alert('Erro ao consultar o serviço de mapas.');
                } finally {
                    btn.innerHTML = textoOriginal;
                    btn.disabled = false;
                }
            }, (err) => {
                let msg = 'Não foi possível aceder à localização.';
                if (err.code === 1) msg = 'Permissão de GPS negada. Autorize o acesso à localização nas definições do navegador.';
                if (err.code === 2) msg = 'Sinal de GPS indisponível neste momento.';
                if (err.code === 3) msg = 'Tempo limite excedido ao tentar obter a localização.';
                alert(msg);
                
                btn.innerHTML = textoOriginal;
                btn.disabled = false;
            }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
        }
        
        function fecharDetalhes(){document.getElementById('modalDetalhes').style.display='none';}

      
      async function salvarLocalLojista(){
            const nome=document.getElementById('cadNome').value.trim(),categoria=document.getElementById('cadCategoria').value,descricao=document.getElementById('cadDescricao').value.trim(),keywords=document.getElementById('cadKeywords').value.trim(),cidade=document.getElementById('cadCidade').value.trim()||cidadeAtual,bairro=document.getElementById('cadBairro').value.trim()||'Centro',whatsapp=limparWhatsApp(document.getElementById('cadWpp').value);
            
            const cep=document.getElementById('cadCep').value.replace(/\D/g, ''); // Adicionado
            const endereco=document.getElementById('cadEndereco').value.trim();
            const horario=document.getElementById('cadHorario').value.trim();
            const telefoneExtra=limparWhatsApp(document.getElementById('cadTelefone').value);
            const instagram=document.getElementById('cadInstagram').value.trim();

            if(!nome||!descricao)return alert('Informe o nome e o que o negócio faz.');
            if(whatsapp&&(whatsapp.length<10||whatsapp.length>13))return alert('Confira o número de WhatsApp.');
            try{
                await db.collection('locais').add({
                    nome, categoria, descricao, keywords, cidade, bairro, whatsapp, 
                    cep, endereco, horario, telefoneExtra, instagram, // cep incluído aqui
                    userId:usuarioLogado?usuarioLogado.uid:'', status:'pendente', destaque:false, plano:'gratuito', criadoEm:firebase.firestore.FieldValue.serverTimestamp()
                });
                fecharModalCadastro();
                alert('Cadastro enviado. Obrigado por ajudar a cidade!');
                ['cadNome','cadDescricao','cadKeywords','cadWpp','cadCep','cadEndereco','cadHorario','cadTelefone','cadInstagram'].forEach(id=>document.getElementById(id).value='');
            }catch(e){console.error(e);alert('Não foi possível enviar o cadastro.');}
        }
      
        function isOwner(l){return !!usuarioLogado && (l.proprietarioUid===usuarioLogado.uid || l.userId===usuarioLogado.uid);}
        function fecharPainel(){document.getElementById('modalPainel').style.display='none';unsubPainel.forEach(fn=>{try{fn()}catch(e){}});unsubPainel=[];}
        
        async function sairDaConta(){
            const botao=document.querySelector('#modalPainel button[onclick="sairDaConta()"]');
            if(botao){botao.disabled=true;botao.innerHTML='<i class="fas fa-spinner fa-spin"></i> Saindo...';}
            try{fecharPainel();await auth.signOut();}
            catch(e){console.error('Erro ao sair:',e);alert('Erro ao sair da conta.');if(botao){botao.disabled=false;botao.innerHTML='<i class="fas fa-right-from-bracket"></i> Sair da conta';}}
        }
        
        function abrirPainel(){if(!usuarioLogado)return;document.getElementById('modalPainel').style.display='block';painelAba=isAdminLogado?'admin':'meus';renderizarPainel();carregarDadosPainel();}
        function trocarAbaPainel(a){painelAba=a;renderizarPainel();}
        
        function carregarDadosPainel(){
            unsubPainel.forEach(fn=>{try{fn()}catch(e){}});unsubPainel=[];if(!usuarioLogado)return;
            const q=db.collection('locais').where('proprietarioUid','==',usuarioLogado.uid);unsubPainel.push(q.onSnapshot(s=>{meusLocaisCache=[];s.forEach(d=>meusLocaisCache.push({idDoc:d.id,...d.data()}));renderizarPainel();},e=>console.error(e)));
            const rq=db.collection('reivindicacoes').where('userId','==',usuarioLogado.uid);unsubPainel.push(rq.onSnapshot(s=>{reivindicacoesCache=[];s.forEach(d=>reivindicacoesCache.push({idDoc:d.id,...d.data()}));renderizarPainel();},e=>console.error(e)));
            const iq=db.collection('interessesDestaque').where('userId','==',usuarioLogado.uid);unsubPainel.push(iq.onSnapshot(s=>{interessesCache=[];s.forEach(d=>interessesCache.push({idDoc:d.id,...d.data()}));renderizarPainel();},e=>console.error(e)));
            if(isAdminLogado){
                unsubPainel.push(db.collection('reivindicacoes').where('status','==','pendente').onSnapshot(s=>{reivindicacoesCache=[];s.forEach(d=>reivindicacoesCache.push({idDoc:d.id,...d.data()}));renderizarPainel();},e=>console.error(e)));
                unsubPainel.push(db.collection('interessesDestaque').where('status','==','novo').onSnapshot(s=>{interessesCache=[];s.forEach(d=>interessesCache.push({idDoc:d.id,...d.data()}));renderizarPainel();},e=>console.error(e)));
            }
        }
        
        function renderizarPainel(){
            const c=document.getElementById('painelConteudo');if(!c||!usuarioLogado)return;c.replaceChildren();
            if(isAdminLogado){document.getElementById('painelTitulo').innerHTML='<i class="fas fa-shield-halved" style="color:var(--primary)"></i> Painel Admin';document.getElementById('painelSubtitulo').textContent='Aprove reivindicações e pedidos de destaque.';renderizarPainelAdmin(c);return;}
            document.getElementById('painelTitulo').innerHTML='<i class="fas fa-user-circle" style="color:var(--primary)"></i> Meu painel';document.getElementById('painelSubtitulo').textContent=`Conta: ${usuarioLogado.email||''}`;
            const tabs=criarEl('div','panel-tabs');[['meus','Meus perfis'],['pedidos','Minhas solicitações']].forEach(([id,t])=>{const b=criarEl('button','panel-tab',t);if(painelAba===id)b.classList.add('active');b.onclick=()=>trocarAbaPainel(id);tabs.appendChild(b);});c.appendChild(tabs);
            
            if(painelAba==='pedidos'){renderizarMinhasSolicitacoes(c);return;}
            
            if(!meusLocaisCache.length){c.appendChild(criarEl('div','empty-state','<span></span>'));c.lastChild.innerHTML='';const i=icone('fas fa-store');c.lastChild.append(i,criarEl('strong','', 'Você ainda não administra nenhum perfil.'),criarEl('p','', 'Quando uma reivindicação for aprovada, o perfil aparecerá aqui.'));const b=criarEl('button','btn-community primary','Adicionar um negócio');b.onclick=()=>{fecharPainel();abrirModalEscolhaAnuncio()};c.lastChild.appendChild(b);return;}
            
            const lista=criarEl('div','panel-list');
            meusLocaisCache.forEach(l=>{
                const item=criarEl('div','panel-item');
                const title=criarEl('div','panel-item-title',l.nome||'Perfil');item.appendChild(title);
                const meta=criarEl('div','panel-item-meta',`${l.categoria||'Serviço'} • ${l.bairro||'Centro'}, ${l.cidade||cidadeAtual}`);item.appendChild(meta);
                const badges=criarEl('div','badges-container-inline');
                if(l.verificado)badges.appendChild(criarEl('span','verified-badge','✓ Verificado'));else badges.appendChild(criarEl('span','pending-badge',l.status==='pendente'?'Aguardando revisão':'Gestão pendente'));
                if(registroDestaque(l))badges.appendChild(criarEl('span','featured-badge','★ Em destaque'));item.appendChild(badges);
                
                const actions=criarEl('div','panel-actions');
                const e=criarEl('button','tiny-btn','Editar perfil');e.onclick=()=>abrirEditarPerfil(l.idDoc);actions.appendChild(e);
                const d=criarEl('button','tiny-btn','Solicitar destaque');d.onclick=()=>{localAtualDetalhes=l;abrirDestaqueLocalAtual()};actions.appendChild(d);item.appendChild(actions);
                
                const share=criarEl('div','profile-share');
                const inp=document.createElement('input');inp.className='form-control';inp.value=gerarLinkPerfil(l);inp.readOnly=true;
                const cp=criarEl('button','tiny-btn','Copiar link');cp.onclick=()=>copiarTexto(inp.value);share.append(inp,cp);item.appendChild(share);
                lista.appendChild(item);
            });
            c.appendChild(lista);
        }
        
        function renderizarMinhasSolicitacoes(c){
            const wrap=criarEl('div','panel-list');const itens=[];
            reivindicacoesCache.filter(x=>x.userId===usuarioLogado.uid).forEach(x=>itens.push(['Reivindicação',x.nomeLocal,x.status]));
            interessesCache.filter(x=>x.userId===usuarioLogado.uid).forEach(x=>itens.push(['Destaque',x.nomeLocal,x.status]));
            if(!itens.length){c.appendChild(criarEl('div','empty-state',''));c.lastChild.append(icone('fas fa-inbox'),criarEl('strong','', 'Nenhuma solicitação.'),criarEl('p','', 'Suas solicitações aparecerão aqui.'));return;}
            itens.forEach(x=>{const i=criarEl('div','panel-item');i.appendChild(criarEl('div','panel-item-title',`${x[0]} • ${x[1]||'Perfil'}`));i.appendChild(criarEl('div','panel-item-meta',`Status: ${x[2]||'pendente'}`));wrap.appendChild(i)});c.appendChild(wrap);
        }
        
        function renderizarPainelAdmin(c){
            const stats=criarEl('div','panel-grid');
            [["Reivindicações",reivindicacoesCache.length],["Pedidos destaque",interessesCache.length],["Perfis gestão",meusLocaisCache.length]].forEach(x=>{const d=criarEl('div','panel-stat');d.append(criarEl('span','',x[0]),criarEl('strong','',String(x[1])));stats.appendChild(d)});c.appendChild(stats);
            const h1=criarEl('h3','', 'Reivindicações');h1.style.marginTop='18px';c.appendChild(h1);
            const list=criarEl('div','panel-list');if(!reivindicacoesCache.length)list.appendChild(criarEl('div','admin-note','Nenhuma reivindicação.'));
            reivindicacoesCache.forEach(r=>{
                const i=criarEl('div','panel-item');i.appendChild(criarEl('div','panel-item-title',r.nomeLocal||'Perfil'));i.appendChild(criarEl('div','panel-item-meta',`${r.email||'Sem e-mail'} • ${r.userId||'—'}`));
                const a=criarEl('div','panel-actions');
                const ok=criarEl('button','tiny-btn','Aprovar');ok.onclick=()=>aprovarReivindicacao(r);
                const no=criarEl('button','tiny-btn danger-btn','Recusar');no.onclick=()=>recusarReivindicacao(r);
                a.append(ok,no);i.appendChild(a);list.appendChild(i)
            });c.appendChild(list);
            const h2=criarEl('h3','', 'Pedidos destaque');h2.style.marginTop='18px';c.appendChild(h2);
            const list2=criarEl('div','panel-list');if(!interessesCache.length)list2.appendChild(criarEl('div','admin-note','Nenhum pedido.'));
            interessesCache.forEach(r=>{
                const i=criarEl('div','panel-item');i.appendChild(criarEl('div','panel-item-title',r.nomeLocal||'Perfil'));i.appendChild(criarEl('div','panel-item-meta',`${r.email||''} ${r.whatsapp?'• '+r.whatsapp:''}`));
                const a=criarEl('div','panel-actions');
                const ok=criarEl('button','tiny-btn','Ativar');ok.onclick=()=>ativarDestaque(r);
                const no=criarEl('button','tiny-btn danger-btn','Recusar');no.onclick=()=>recusarDestaque(r);
                a.append(ok,no);i.appendChild(a);list2.appendChild(i)
            });c.appendChild(list2);
        }
        
        async function aprovarReivindicacao(r){
            if(!isAdminLogado)return;if(!confirm(`Aprovar gestão de ${r.nomeLocal}?`))return;
            try{
                const localRef=db.collection('locais').doc(r.localId),reqRef=db.collection('reivindicacoes').doc(r.idDoc);
                await db.runTransaction(async tx=>{
                    const reqSnap=await tx.get(reqRef);if(!reqSnap.exists)throw new Error('Solicitação não encontrada.');
                    if(reqSnap.data().status!=='pendente')throw new Error('Já respondida.');
                    const localSnap=await tx.get(localRef);if(!localSnap.exists)throw new Error('Perfil não existe mais.');
                    tx.update(localRef,{proprietarioUid:r.userId,proprietarioDeclarado:true,verificado:true,status:'aprovado',atualizadoEm:firebase.firestore.FieldValue.serverTimestamp()});
                    tx.update(reqRef,{status:'aprovado',aprovadoEm:firebase.firestore.FieldValue.serverTimestamp()});
                });alert('Gestão aprovada.');
            }catch(e){console.error(e);alert(e.message);}
        }
        async function recusarReivindicacao(r){if(!isAdminLogado)return;if(!confirm('Recusar?'))return;try{await db.collection('reivindicacoes').doc(r.idDoc).update({status:'recusado',respondidoEm:firebase.firestore.FieldValue.serverTimestamp()});}catch(e){console.error(e);}}
        async function ativarDestaque(r){
            if(!isAdminLogado)return;if(!confirm(`Ativar destaque para ${r.nomeLocal}?`))return;
            try{
                const localRef=db.collection('locais').doc(r.localId),pedidoRef=db.collection('interessesDestaque').doc(r.idDoc);
                await db.runTransaction(async tx=>{
                    const pedidoSnap=await tx.get(pedidoRef);if(!pedidoSnap.exists)throw new Error('Pedido não encontrado.');
                    if(pedidoSnap.data().status==='aprovado')throw new Error('Já aprovado.');
                    const localSnap=await tx.get(localRef);if(!localSnap.exists)throw new Error('Perfil não existe mais.');
                    tx.update(localRef,{destaque:true,plano:'destaque',destaqueAtivadoEm:firebase.firestore.FieldValue.serverTimestamp()});
                    tx.update(pedidoRef,{status:'aprovado',respondidoEm:firebase.firestore.FieldValue.serverTimestamp()});
                });alert('Destaque ativado.');
            }catch(e){console.error(e);alert(e.message);}
        }
        async function recusarDestaque(r){if(!isAdminLogado)return;if(!confirm('Recusar destaque?'))return;try{await db.collection('interessesDestaque').doc(r.idDoc).update({status:'recusado',respondidoEm:firebase.firestore.FieldValue.serverTimestamp()});}catch(e){console.error(e);}}
        
        function abrirEditarPerfil(id){
            const l=listaLocaisCache.find(x=>x.idDoc===id)||meusLocaisCache.find(x=>x.idDoc===id);
            if(!l||!isOwner(l)){alert('Sem permissão.');return;}
            document.getElementById('editLocalId').value=l.idDoc;
            document.getElementById('editNome').value=l.nome||'';
            document.getElementById('editCategoria').value=l.categoria||'Serviços';
            document.getElementById('editDescricao').value=l.descricao||l.servicos||'';
            document.getElementById('editKeywords').value=l.keywords||l.palavrasChave||'';
            document.getElementById('editCep').value=l.cep||'';
            document.getElementById('editCidade').value=l.cidade||cidadeAtual;
            document.getElementById('editBairro').value=l.bairro||'Centro';
            document.getElementById('editWpp').value=l.whatsapp||'';
            document.getElementById('editMensagem').textContent='';
            document.getElementById('editEndereco').value=l.endereco||'';
            document.getElementById('editHorario').value=l.horario||'';
            document.getElementById('editTelefone').value=l.telefoneExtra||'';
            document.getElementById('editInstagram').value=l.instagram||'';
            document.getElementById('modalEditarPerfil').style.display='block';
        }
        function fecharEditarPerfil(){document.getElementById('modalEditarPerfil').style.display='none';}
        async function salvarEdicaoPerfil(){
            const id=document.getElementById('editLocalId').value,l=listaLocaisCache.find(x=>x.idDoc===id)||meusLocaisCache.find(x=>x.idDoc===id),msg=document.getElementById('editMensagem');
            if(!l||!isOwner(l))return;const w=limparWhatsApp(document.getElementById('editWpp').value);
            if(w&&(w.length<10||w.length>13)){msg.textContent='Confira o WhatsApp.';return;}
            msg.textContent='Salvando...';
            try{
              await db.collection('locais').doc(id).update({
                    nome:document.getElementById('editNome').value.trim(),
                    categoria:document.getElementById('editCategoria').value,
                    descricao:document.getElementById('editDescricao').value.trim(),
                    keywords:document.getElementById('editKeywords').value.trim(),
                    cidade:document.getElementById('editCidade').value.trim(),
                    bairro:document.getElementById('editBairro').value.trim()||'Centro',
                    whatsapp:w,
                    cep:document.getElementById('editCep').value.replace(/\D/g, ''), // Adicionado
                    endereco:document.getElementById('editEndereco').value.trim(),
                    horario:document.getElementById('editHorario').value.trim(),
                    telefoneExtra:limparWhatsApp(document.getElementById('editTelefone').value),
                    instagram:document.getElementById('editInstagram').value.trim(),
                    atualizadoEm:firebase.firestore.FieldValue.serverTimestamp()
                });
                msg.textContent='Perfil atualizado.';setTimeout(fecharEditarPerfil,500);
            }catch(e){console.error(e);msg.textContent='Erro ao salvar.';}
        }
        
       function gerarLinkPerfil(l) {
            return `${location.origin}/perfil.html?id=${l.idDoc}`;
        }
        async function copiarTexto(t){try{await navigator.clipboard.writeText(t);alert('Link copiado.');}catch(e){prompt('Copie o link:',t);}}
        function abrirPerfilPorHash(){const m=location.hash.match(/^#perfil=(.+)$/);if(m){const id=decodeURIComponent(m[1]);setTimeout(()=>{const l=listaLocaisCache.find(x=>x.idDoc===id);if(l)abrirDetalhesLocal(id);},700);}}
        
        function abrirAreaAcessoClick(){if(usuarioLogado){abrirPainel();return;}modoCadastroAcesso=false;atualizarModalAcesso();document.getElementById('modalAreaAcesso').style.display='block';}
        function alternarModoAcesso(){modoCadastroAcesso=!modoCadastroAcesso;atualizarModalAcesso();}
        function atualizarModalAcesso(){
            document.getElementById('tituloAcesso').textContent=modoCadastroAcesso?'Criar acesso':'Área de Acesso';
            document.getElementById('subtituloAcesso').textContent=modoCadastroAcesso?'Crie uma conta.':'Entre para acompanhar.';
            document.getElementById('btnEntrarAcesso').textContent=modoCadastroAcesso?'Criar conta':'Entrar';
            document.getElementById('btnCriarConta').textContent=modoCadastroAcesso?'Já tenho conta':'Criar acesso';
            document.getElementById('acessoMensagem').textContent='';
        }
        function fecharAreaAcesso(){document.getElementById('modalAreaAcesso').style.display='none';}
        async function executarLoginUnificado(){
            const email=document.getElementById('acessoEmail').value.trim(),senha=document.getElementById('acessoSenha').value,msg=document.getElementById('acessoMensagem');
            if(!email||!senha){msg.textContent='Informe e-mail e palavra-passe.';return;}
            if(modoCadastroAcesso&&senha.length<6){msg.textContent='Mínimo 6 caracteres.';return;}
            msg.textContent='Aguarde...';
            try{if(modoCadastroAcesso)await auth.createUserWithEmailAndPassword(email,senha);else await auth.signInWithEmailAndPassword(email,senha);msg.textContent='Sucesso.';setTimeout(fecharAreaAcesso,400);}
            catch(e){console.error(e);msg.textContent='Falha ao acessar. Verifique seus dados.';}
        }

        function abrirModalIndicacao(termo=''){document.getElementById('modalIndicacao').style.display='block';document.getElementById('indCidade').value=cidadeAtual;if(termo)document.getElementById('indServico').value=termo;setTimeout(()=>document.getElementById('indNome').focus(),50);}
        function fecharModalIndicacao(){document.getElementById('modalIndicacao').style.display='none';}
        async function enviarIndicacao(){
            const nome=document.getElementById('indNome').value.trim(),servico=document.getElementById('indServico').value.trim(),cidade=document.getElementById('indCidade').value.trim()||cidadeAtual,bairro=document.getElementById('indBairro').value.trim(),whatsapp=limparWhatsApp(document.getElementById('indWpp').value);
            if(!nome||!servico)return alert('Informe nome e serviço.');
            try{
                await db.collection('indicacoes').add({nome,servico,cidade,bairro,whatsapp,origem:'busca-sem-resultado',userId:usuarioLogado?usuarioLogado.uid:'',status:'pendente',criadoEm:firebase.firestore.FieldValue.serverTimestamp()});
                fecharModalIndicacao();alert('Indicação enviada!');['indNome','indServico','indBairro','indWpp'].forEach(id=>document.getElementById(id).value='');
            }catch(e){console.error(e);alert('Erro ao enviar.');}
        }

function mascaraCep(input) {
            let valor = input.value.replace(/\D/g, '');
            if (valor.length > 5) {
                valor = valor.slice(0, 5) + '-' + valor.slice(5, 8);
            }
            input.value = valor;
        }

        async function buscarCepBlur(input, prefixo) {
            const cepLimpo = input.value.replace(/\D/g, '');
            if (cepLimpo.length === 8) {
                const endInput = document.getElementById(`${prefixo}Endereco`);
                const bairroInput = document.getElementById(`${prefixo}Bairro`);
                const cidadeInput = document.getElementById(`${prefixo}Cidade`);
                
                const placeholderAntigo = endInput.placeholder;
                endInput.value = "A procurar endereço...";
                
                try {
                    // Consulta via ViaCEP
                    const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
                    const data = await res.json();
                    
                    if (!data.erro) {
                        endInput.value = data.logradouro ? data.logradouro + ', ' : '';
                        bairroInput.value = data.bairro || '';
                        cidadeInput.value = data.localidade || '';
                    } else {
                        endInput.value = '';
                        alert('CEP não encontrado. Pode preencher os dados manualmente.');
                    }
                } catch (e) {
                    console.error("Erro na busca de CEP:", e);
                    endInput.value = '';
                    endInput.placeholder = placeholderAntigo;
                }
            }
        }

        function abrirChatIA(){document.getElementById('modalChatIA').style.display='block';const c=document.getElementById('chatMensagens');if(c&&!c.dataset.intro){adicionarMensagemChat('Descreva o que procura. Posso buscar nos anúncios ou na web.','bot');c.dataset.intro='true';}document.getElementById('inputChatUser').focus();}
        function adicionarMensagemChat(texto,tipo='bot',link=null){
            const c=document.getElementById('chatMensagens'),d=criarEl('div');
            d.style.background=tipo==='user'?'var(--purple)':'var(--surface)';d.style.color=tipo==='user'?'white':'var(--dark)';
            d.style.padding='10px 14px';d.style.borderRadius='16px';d.style.maxWidth='85%';
            d.style.alignSelf=tipo==='user'?'flex-end':'flex-start';d.style.fontSize='13px';d.style.lineHeight='1.5';
            if(tipo!=='user')d.style.border='1px solid var(--border)';
            d.textContent=texto;
            if(link){const a=document.createElement('a');a.href=link;a.target='_blank';a.rel='noopener noreferrer';a.textContent=' Falar pelo WhatsApp';a.style.fontWeight='800';a.style.display='inline-block';a.style.marginTop='7px';d.append(document.createElement('br'),a);}
            c.appendChild(d);c.scrollTop=c.scrollHeight;
        }
        function enviarMensagemChat(){
            const input=document.getElementById('inputChatUser'),texto=input.value.trim();if(!texto)return;
            adicionarMensagemChat(texto,'user');input.value='';
            setTimeout(()=>{
                const p=normalizarTexto(texto),imovelIntent=['casa','apartamento','terreno','imovel','temporada','aluguel','venda','garagem','chacara','sitio'].some(x=>p.includes(x));
                if(imovelIntent){
                    const a=listaImoveisCache.filter(registroAprovado).filter(i=>normalizarTexto(i.cidade||'Paraisópolis')===normalizarTexto(cidadeAtual)).filter(i=>combina(i,true,texto));
                    if(a.length){const i=a[0];adicionarMensagemChat(`Encontrei ${a.length} imóvel(is). Ex: ${i.titulo}, ${i.transacao}, ${Number(i.preco||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}.`,'bot',limparWhatsApp(i.whatsapp)?`https://wa.me/55${limparWhatsApp(i.whatsapp)}`:null);return;}
                }
                const a=listaLocaisCache.filter(registroAprovado).filter(l=>normalizarTexto(l.cidade||'Paraisópolis')===normalizarTexto(cidadeAtual)).filter(l=>combina(l,false,texto));
                if(a.length){
                    const l=a[0];adicionarMensagemChat(`Encontrei ${a.length} serviço(s). Ex: ${l.nome} (${l.categoria}), no ${l.bairro||'Centro'}.`,'bot',limparWhatsApp(l.whatsapp)?`https://wa.me/55${limparWhatsApp(l.whatsapp)}`:null);
                } else if(texto.length >= 3 && typeof GEMINI_API_KEY !== 'undefined' && GEMINI_API_KEY) {
                    adicionarMensagemChat(`Procurando na web por "${texto}"...`,'bot');
                    buscarComGeminiChat(texto);
                } else {
                    adicionarMensagemChat(`Não encontrei "${texto}" em ${cidadeAtual}.`,'bot');
                }
            },250);
        }
        
        async function buscarComGeminiChat(termo) {
             const prompt = `Aja como um assistente de diretório local. Busque de forma concisa 1 estabelecimento comercial na cidade de ${cidadeAtual}, Minas Gerais, para "${termo}". Responda em 1 frase curta com Nome, Categoria e Endereço.`;
             try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });
                const data = await response.json();
                let textoIA = data.candidates[0].content.parts[0].text;
                adicionarMensagemChat("Encontrei na Web: " + textoIA, 'bot');
             } catch(e) {
                 adicionarMensagemChat(`Ainda não encontrei "${termo}" em ${cidadeAtual} nem na web.`, 'bot');
             }
        }

       function iniciarListeners(){
            db.collection('locais').where('status','in',['aprovado','ativo']).onSnapshot(s=>{listaLocaisCache=[];s.forEach(d=>listaLocaisCache.push({idDoc:d.id,...d.data()}));atualizarSeletorCidades();atualizarListaBairros();renderizarLocais();abrirPerfilPorHash();},e=>{console.error(e);});
        }
        document.querySelectorAll('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.style.display='none';}));
        document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.modal').forEach(m=>m.style.display='none');});
        
        iniciarListeners();
        window.addEventListener('hashchange',abrirPerfilPorHash);
        setTimeout(abrirPerfilPorHash,1200);
