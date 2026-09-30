"use strict";

/* =========================================================
   ELLA — aplicação integrada
   Visual: primeira versão
   Funcionalidades: agenda/ciclo/serviços/consulta/apoio
   + biblioteca de conteúdos da primeira versão
   ========================================================= */

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pad=n=>String(n).padStart(2,"0");
const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parse=s=>{const [y,m,d]=String(s).split("-").map(Number);return new Date(y,m-1,d)};
const fmt=s=>s?parse(s).toLocaleDateString("pt-BR"):"";
const todayS=()=>iso(new Date());
const diffDays=(a,b)=>Math.round((parse(b)-parse(a))/864e5);
const rel=s=>{const d=diffDays(todayS(),s);return d<0?"já passou":d===0?"hoje":d===1?"amanhã":`em ${d} dias`};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);

const NAV=[
  ["inicio","Início"],["agenda","Agenda"],["ciclo","Ciclo"],["prevencao","Prevenção"],
  ["gestacao","Gestação"],["servicos","Serviços"],["consulta","Consulta"],["apoio","Apoio"]
];

const KEY="ella-prototipo-v3";
let D={ev:[],cy:[],q:{},user:null};
try{Object.assign(D,JSON.parse(localStorage.getItem(KEY)||"{}"))}catch(e){}
try{
  const old=JSON.parse(localStorage.getItem("ella")||"null");
  if(old&&!localStorage.getItem(KEY)){
    D.ev=(old.ev||[]).map(e=>({id:uid(),t:e.t,d:e.d,k:e.k||"Outro",n:e.n||""}));
    D.cy=old.cy||[];
    D.q=old.q||{};
  }
}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(D))}catch(e){}};

const app=$("#app");
const nav=$("#nav");

nav.innerHTML=NAV.map(([id,label])=>
  `<a href="#/${id}" data-route="${id}">${label}</a>`
).join("");

function setActive(id){
  $$("#nav a").forEach(a=>a.setAttribute("aria-current",a.dataset.route===id?"page":"false"));
}
function go(id,replace=false){
  const hash=`#/${id}`;
  if(replace) history.replaceState(null,"",hash);
  else if(location.hash!==hash) location.hash=hash;
  renderRoute(id);
}
function renderRoute(id){
  setActive(id);
  $$("#nav a").forEach(a=>a.classList.toggle("active",a.dataset.route===id));
  const route=id||"inicio";
  if(route.startsWith("conteudo/")) return renderArticle(route.slice(9));
  if(route==="conteudos") return renderContents();
  if(route==="prevencao"){ renderContents(); return; }
  const view=VIEWS[route]?VIEWS[route]():VIEWS.inicio();
  app.innerHTML=view;
  bindView(route);
  window.scrollTo({top:0,behavior:"smooth"});
}
function currentRoute(){
  const h=location.hash.replace(/^#\//,"")||"inicio";
  return decodeURIComponent(h);
}
window.addEventListener("hashchange",()=>renderRoute(currentRoute()));

function icon(name){
  const p={
    calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    drop:'<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    heart:'<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
    shield:'<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    book:'<path d="M5 4h9a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4z"/><path d="M5 16a4 4 0 0 1 4-4h9"/>',
    plus:'<path d="M12 5v14M5 12h14"/>'
  };
  return `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${p[name]||""}</svg>`;
}

/* ---------- Home ---------- */
function home(){
  const upcoming=[...D.ev].filter(e=>e.d>=todayS()).sort((a,b)=>a.d.localeCompare(b.d)).slice(0,3);
  return `<section class="hero">
    <div class="wrap hero-in">
      <div class="hero-copy">
        <p class="eyebrow">Informação que vira cuidado</p>
        <h1>Cuidar da saúde não deveria depender de lembrar de tudo.</h1>
        <p class="lead">A ELLA ajuda mulheres e pessoas com colo do útero a organizar exames, ciclo e consultas, encontrar o serviço certo no SUS e consultar informações confiáveis.</p>
        <div class="hero-actions">
          <a class="btn lg" href="#/agenda">${icon("calendar")} Minha agenda</a>
          <a class="btn alt lg" href="#/prevencao">${icon("book")} Prevenção</a>
        </div>
      </div>
      <div class="carta" aria-hidden="true">
        <svg viewBox="0 0 64 64"><use href="#emblema"/></svg>
        <small>Acolher. Informar. Conectar.</small>
      </div>
    </div>
  </section>
  <section class="page">
    <div class="wrap">
      <div class="pagehead">
        <h2>Próximos lembretes</h2>
        <p class="lead">Tudo fica salvo somente neste navegador e neste aparelho.</p>
      </div>
      ${upcoming.length?`<ul class="data-list">${upcoming.map(eventLi).join("")}</ul>`:
        `<div class="empty">Nenhum lembrete próximo. <a class="btn sm" href="#/agenda">Adicionar à agenda</a></div>`}
      <div class="note home-notes"><b>Privacidade:</b> a ELLA não envia seus registros para servidores. Evite colocar dados pessoais sensíveis neste protótipo.</div>
      <div class="sec" style="padding-bottom:0">
        <div class="pagehead"><h2>O que você quer organizar?</h2><p class="lead">Acesse rapidamente as principais áreas.</p></div>
        <div class="quick-grid">
          ${quickCards()}
        </div>
      </div>
    </div>
  </section>`;
}
function quickCards(){
 const q=[
  ["agenda","calendar","Agenda de cuidados","Exames, consultas e vacinas com data."],
  ["ciclo","drop","Meu ciclo","Registre menstruações e veja uma estimativa."],
  ["prevencao","shield","Prevenção","Colo do útero, mama, pele, vacinação e mais."],
  ["gestacao","heart","Gestação e perda gestacional","Sinais de alerta, acolhimento e informações."],
  ["servicos","shield","Onde procurar atendimento","Descubra por onde começar no SUS."],
  ["consulta","book","Preparar consulta","Anote sintomas, perguntas e informações importantes."],
  ["apoio","heart","Apoio e segurança","Violência, saúde mental e canais de ajuda."]
 ];
 return q.map(x=>`<a class="card" href="#/${x[0]}"><div class="icon-chip">${icon(x[1])}</div><h3>${x[2]}</h3><p>${x[3]}</p><span class="more">Abrir →</span></a>`).join("");
}

/* ---------- Agenda ---------- */
function eventLi(e){
 const note=e.n?` · ${esc(e.n)}`:"";
 return `<li><div><b>${esc(e.t)}</b> <span class="pill">${esc(e.k||"Outro")}</span><small>${fmt(e.d)} · ${rel(e.d)}${note}</small></div>
 <button class="x" type="button" data-del-event="${esc(e.id)}" aria-label="Apagar ${esc(e.t)}">×</button></li>`;
}
function agenda(){
 const events=[...D.ev].sort((a,b)=>a.d.localeCompare(b.d));
 return `<section class="page"><div class="wrap">
   <div class="view-head"><h1>Minha agenda de cuidados</h1><p class="lead">Cadastre consultas, exames, vacinas e outras datas. Você define as datas; a ELLA mostra o que está chegando.</p></div>
   <div class="grid">
    <div class="card">
      <h3>Adicionar lembrete</h3>
      <form id="event-form">
       <div class="campo"><label for="et">O que é?</label><input id="et" required maxlength="100" placeholder="Ex.: consulta ginecológica"></div>
       <div class="form-grid">
        <div class="campo"><label for="ed">Data</label><input id="ed" type="date" required></div>
        <div class="campo"><label for="ek">Tipo</label><select id="ek"><option>Exame</option><option>Consulta</option><option>Vacina</option><option>Retorno</option><option>Outro</option></select></div>
       </div>
       <div class="campo"><label for="en">Observação (opcional)</label><textarea id="en" maxlength="500" placeholder="O que você quer lembrar?"></textarea></div>
       <button class="btn" type="submit">Salvar na agenda</button>
      </form>
    </div>
    <div class="card">
      <h3>Seus lembretes</h3>
      ${events.length?`<ul class="data-list" id="event-list">${events.map(eventLi).join("")}</ul>`:`<div class="empty">Sua agenda está vazia.</div>`}
    </div>
   </div>
 </div></section>`;
}

/* ---------- Ciclo ---------- */
function cycle(){
 const c=[...D.cy].sort();
 let result=`<div class="empty">Nenhum registro ainda. Registre o primeiro dia de cada menstruação.</div>`;
 if(c.length===1) result=`<div class="note">Você já registrou um início. Registre outro para que a ELLA possa calcular uma média entre ciclos.</div>`;
 if(c.length>1){
  const gaps=[];
  for(let i=1;i<c.length;i++) gaps.push(Math.round((parse(c[i])-parse(c[i-1]))/864e5));
  const avg=Math.round(gaps.reduce((a,b)=>a+b,0)/gaps.length);
  const next=iso(new Date(parse(c[c.length-1]).getTime()+avg*864e5));
  result=`<div class="card"><div class="big-stat">${avg} dias</div><p>duração média do ciclo (${gaps.length} ${gaps.length>1?"ciclos":"ciclo"}).</p><p>Próxima menstruação estimada: <b>${fmt(next)}</b>.</p><button class="btn alt" type="button" id="cycle-to-agenda" data-date="${next}">Criar lembrete na agenda</button></div>`;
 }
 return `<section class="page"><div class="wrap">
  <div class="view-head"><h1>Meu ciclo</h1><p class="lead">Registre o primeiro dia de cada menstruação. Com dois ou mais registros, a ELLA calcula a duração média e estima a próxima.</p></div>
  <div class="grid">
   <div class="card"><form id="cycle-form"><div class="campo"><label for="cd">Primeiro dia da menstruação</label><input id="cd" type="date" required></div><button class="btn" type="submit">Registrar</button></form></div>
   <div>${result}</div>
  </div>
  <div class="card"><h3>Registros</h3>${c.length?`<ul class="data-list">${c.slice().reverse().map(d=>`<li><span>${fmt(d)}</span><button class="x" type="button" data-del-cycle="${d}" aria-label="Apagar ${fmt(d)}">×</button></li>`).join("")}</ul>`:`<div class="empty">Nenhum registro ainda.</div>`}</div>
  <div class="note">A previsão é uma estimativa baseada apenas nos seus registros e <b>não serve como método contraceptivo</b>. Se o ciclo mudar muito, houver sangramento fora do esperado ou dor forte, procure a UBS.</div>
 </div></section>`;
}

/* ---------- Prevenção / biblioteca ---------- */
function contentCard(a){
 return `<article class="card content-card">
   <span class="pill">${esc(a.c[0]||"Saúde")}</span>
   <h3>${esc(a.t)}</h3><p>${esc(a.r)}</p>
   <a class="btn alt sm more" href="#/conteudo/${encodeURIComponent(a.id)}">Ler conteúdo</a>
 </article>`;
}
function renderContents(filter=""){
 const list=filter?[...A].filter(a=>(a.t+" "+a.r+" "+a.c.join(" ")).toLowerCase().includes(filter.toLowerCase())):A;
 app.innerHTML=`<section class="page"><div class="wrap">
  <div class="view-head"><h1>Prevenção e informação</h1><p class="lead">Conteúdos educativos para ajudar você a entender cuidados e serviços. Eles não substituem avaliação profissional.</p></div>
  <div class="toolbar"><input id="content-search" type="search" placeholder="Buscar assunto..." value="${esc(filter)}"><span class="pill">${list.length} conteúdo(s)</span></div>
  <div class="content-grid">${list.length?list.map(contentCard).join(""):`<div class="empty">Não encontrei conteúdo com esse termo.</div>`}</div>
 </div></section>`;
 $("#content-search").addEventListener("input",e=>renderContents(e.target.value));
 setActive("prevencao"); window.scrollTo({top:0,behavior:"smooth"});
}
function renderArticle(id){
 const a=A.find(x=>x.id===id);
 if(!a){app.innerHTML=`<section class="page"><div class="wrap"><div class="empty"><h2>Conteúdo não encontrado</h2><a class="btn" href="#/prevencao">Voltar</a></div></div></section>`;return}
 app.innerHTML=`<section class="page"><div class="wrap article">
   <div class="article-back"><a href="#/prevencao">← Voltar para Prevenção</a></div>
   <div class="article-head"><span class="pill">${esc(a.c.join(" · "))}</span><h1>${esc(a.t)}</h1><p class="lead">${esc(a.r)}</p></div>
   <div>${a.b}</div>
   ${a.s?.length?srcInline(a.s):""}
 </div></section>`;
 setActive("prevencao"); window.scrollTo({top:0,behavior:"smooth"});
}

/* ---------- Gestação ---------- */
function gestacao(){
 const a=A.find(x=>x.id==="gestacao-perda-gestacional");
 return `<section class="page"><div class="wrap">
   <div class="view-head"><h1>Gestação e perda gestacional</h1><p class="lead">Informação acolhedora, sinais de alerta e orientação sobre quando procurar atendimento.</p></div>
   <div class="alert-box"><h3>Procure atendimento agora</h3><p>Durante a gravidez, sangramento intenso, dor forte, febre, tontura ou mal-estar intenso precisam de avaliação. Em emergência, ligue <b>192 (SAMU)</b>.</p></div>
   ${a?`<div class="card article">${a.b}${a.s?.length?srcInline(a.s):""}</div>`:""}
 </div></section>`;
}

/* ---------- Serviços ---------- */
const SERVICE={
 a:["Unidade Básica de Saúde (UBS)","Vá à UBS mais próxima. O preventivo é feito na atenção primária por profissional habilitado."],
 b:["UBS, o quanto antes","Corrimento, odor forte, lesões ou verrugas devem ser avaliados por uma equipe de saúde."],
 c:["UBS","Vacinas do calendário e preservativos são disponibilizados na atenção primária. Consulte o calendário oficial."],
 d:["UBS: pré-natal","Procure a UBS para iniciar o pré-natal. Em sangramento, dor forte ou febre, procure urgência."],
 e:["Peça ajuda agora","Perigo imediato: 190. Orientação e denúncia: Ligue 180. Violência sexual: procure UBS, UPA ou hospital."],
 f:["UBS, CAPS ou CVV","Para apoio emocional, o CVV atende pelo 188. Para acompanhamento, comece pela UBS; em emergência de saúde, 192."],
 h:["UPA ou hospital","Sangramento, dor forte, febre ou tontura na gravidez precisam de avaliação rápida. Ligue 192 se estiver muito mal."],
 g:["Volte à UBS que pediu o exame","Leve o resultado. A equipe define se é necessário repetir exame, fazer colposcopia ou seguir outro caminho."]
};
function services(){
 return `<section class="page"><div class="wrap">
  <div class="view-head"><h1>Onde procurar atendimento</h1><p class="lead">Escolha uma situação para ver um próximo passo geral dentro da rede de saúde.</p></div>
  <div class="card">
   <label for="sit">Qual é a sua situação?</label>
   <select id="sit">
    <option value="">Escolha…</option>
    <option value="a">Quero fazer o preventivo ou tirar dúvidas de rotina</option>
    <option value="b">Corrimento, odor, verrugas ou lesões</option>
    <option value="c">Preciso de vacina ou preservativo</option>
    <option value="d">Estou grávida ou acho que estou</option>
    <option value="e">Estou sofrendo violência</option>
    <option value="f">Estou mal emocionalmente</option>
    <option value="h">Estou grávida e tenho sangramento ou dor</option>
    <option value="g">Tive um resultado alterado</option>
   </select>
   <div id="service-result" class="situation"><div class="note">Escolha uma situação para ver o próximo passo.</div></div>
  </div>
  <div class="grid">
   <div class="card"><h3>Levar sempre</h3><p>Documento com foto, Cartão Nacional de Saúde se tiver, exames anteriores e caderneta de vacinação quando aplicável.</p></div>
   <div class="card"><h3>Ferramentas oficiais</h3><p><a href="https://www.gov.br/saude/pt-br/composicao/seidigi/meususdigital" target="_blank" rel="noopener">Meu SUS Digital</a> e CNES podem ajudar a consultar informações da rede.</p></div>
  </div>
 </div></section>`;
}

/* ---------- Consulta ---------- */
function consulta(){
 return `<section class="page"><div class="wrap">
  <div class="view-head"><h1>Preparar minha consulta</h1><p class="lead">Anote antes para não esquecer nada. O conteúdo fica salvo somente neste aparelho.</p></div>
  <div class="card">
   <form id="consult-form">
    <div class="campo"><label for="q1">O que me trouxe aqui / o que estou sentindo</label><textarea id="q1" maxlength="1000">${esc(D.q.q1||"")}</textarea></div>
    <div class="form-grid">
      <div class="campo"><label for="q2">Data da última menstruação</label><input id="q2" type="date" value="${esc(D.q.q2||"")}"></div>
      <div class="campo"><label for="q3">Data do último preventivo</label><input id="q3" type="date" value="${esc(D.q.q3||"")}"></div>
    </div>
    <div class="campo"><label for="q4">Medicamentos, alergias e histórico na família</label><textarea id="q4" maxlength="1000">${esc(D.q.q4||"")}</textarea></div>
    <div class="campo"><label for="q5">Perguntas para fazer</label><textarea id="q5" maxlength="1000">${esc(D.q.q5||"")}</textarea></div>
    <div class="row"><button class="btn" type="submit">Salvar</button><button class="btn alt" type="button" id="print-consult">Imprimir</button><span id="consult-status" class="src"></span></div>
   </form>
  </div>
  <div class="note"><b>Depois da consulta:</b> pergunte qual é o próximo passo, quando voltar e quando saem os resultados. Registre a data na Agenda.</div>
 </div></section>`;
}

/* ---------- Apoio ---------- */
function apoio(){
 return `<section class="page"><div class="wrap">
  <div class="view-head"><h1>Apoio e segurança</h1><p class="lead">Você não precisa enfrentar uma situação de violência ou sofrimento emocional sozinha.</p></div>
  <div class="help-grid">
   <div class="card contact-card"><div class="help-number">180</div><h3>Central de Atendimento à Mulher</h3><p>Orientação sobre direitos, denúncia e rede de proteção.</p></div>
   <div class="card contact-card"><div class="help-number">190</div><h3>Polícia Militar</h3><p>Em perigo imediato.</p></div>
   <div class="card contact-card"><div class="help-number">192</div><h3>SAMU</h3><p>Emergência de saúde.</p></div>
   <div class="card contact-card"><div class="help-number">188</div><h3>CVV</h3><p>Apoio emocional por telefone ou chat.</p></div>
  </div>
  <div class="grid">
   <div class="card"><h2>Para onde ir</h2><ul><li>UBS, UPA ou hospital: atendimento de saúde.</li><li>DEAM, quando existir, ou qualquer delegacia.</li><li>CRAS e CREAS: assistência social.</li><li>CAPS: cuidado em saúde mental.</li></ul></div>
   <div class="card"><h2>Com segurança</h2><p>Se alguém controla seu aparelho, use o botão <b>Sair rápido</b> e considere limpar o histórico do navegador. Procure uma pessoa de confiança e combine uma forma segura de pedir ajuda.</p></div>
  </div>
  <div class="note">O ELLA não substitui atendimento profissional e não mantém telefones próprios de serviços da sua cidade. Confirme informações locais em fontes oficiais.</div>
 </div></section>`;
}

/* ---------- Páginas institucionais ---------- */
function institutional(title,body){
 return `<section class="page"><div class="wrap"><div class="article">
   <div class="view-head"><h1>${title}</h1></div>${body}
 </div></div></section>`;
}
function about(){return institutional("Sobre o ELLA",`<p>A ELLA é um projeto acadêmico de informação e organização pessoal em saúde. A proposta é reunir conteúdos educativos, ajudar a organizar lembretes e facilitar o entendimento de caminhos de acesso ao SUS.</p><div class="note">A ELLA não faz diagnóstico, não interpreta exames e não substitui profissionais de saúde.</div>`)}
function privacy(){return institutional("Privacidade",`<p>Neste protótipo, os registros da agenda, ciclo e preparação da consulta ficam armazenados localmente no navegador, neste aparelho, por meio do armazenamento local.</p><p>Não há envio desses registros para um servidor nesta versão. Ainda assim, evite inserir informações altamente sensíveis em um protótipo.</p>`)}
function accessibility(){return institutional("Acessibilidade",`<p>A interface utiliza navegação por teclado, foco visível, estrutura semântica, textos alternativos nos elementos gráficos decorativos e suporte a redução de movimento.</p><p>Se algum componente apresentar barreira de acesso, use o contato do projeto para relatar o problema.</p>`)}
function sources(){return institutional("Fontes",`<p>Os conteúdos da biblioteca apresentam suas fontes diretamente em cada artigo. Entre elas estão Ministério da Saúde, INCA, OMS, legislação federal e serviços oficiais.</p><div class="card">${srcList(Object.keys(S))}</div>`)}
function publicServices(){return institutional("Serviços públicos",`<div class="grid"><div class="card"><h3>UBS</h3><p>Porta de entrada para consultas, vacinação, prevenção, pré-natal e encaminhamentos.</p></div><div class="card"><h3>UPA / hospital</h3><p>Atendimento de urgências e situações que precisam de avaliação imediata.</p></div><div class="card"><h3>CAPS</h3><p>Serviço do SUS voltado ao cuidado em saúde mental.</p></div></div>`)}
function contact(){return institutional("Contato",`<p>O ELLA é um protótipo acadêmico. Nesta versão, não há atendimento clínico nem canal próprio de emergência.</p><p>Para situações de saúde, procure a rede do SUS. Em emergência, ligue 192.</p>`)}

const VIEWS={
 inicio:home, agenda, ciclo:cycle, prevencao:()=>{renderContents();return null},
 gestacao, servicos:services, consulta, apoio,
 sobre:about, privacidade:privacy, acessibilidade:accessibility, fontes:sources,
 "servicos-publicos":publicServices, contato:contact
};

function bindView(route){
 if(route==="agenda"){
  const form=$("#event-form");
  form?.addEventListener("submit",e=>{
   e.preventDefault();
   const t=$("#et").value.trim(),d=$("#ed").value;
   if(!t||!d)return;
   D.ev.push({id:uid(),t,d,k:$("#ek").value,n:$("#en").value.trim()});
   save(); renderRoute("agenda");
  });
  $$("[data-del-event]").forEach(b=>b.addEventListener("click",()=>{
   D.ev=D.ev.filter(x=>String(x.id)!==String(b.dataset.delEvent));save();renderRoute("agenda");
  }));
 }
 if(route==="ciclo"){
  $("#cycle-form")?.addEventListener("submit",e=>{
   e.preventDefault();const d=$("#cd").value;if(!d)return;
   if(!D.cy.includes(d))D.cy.push(d);D.cy.sort();save();renderRoute("ciclo");
  });
  $$("[data-del-cycle]").forEach(b=>b.addEventListener("click",()=>{
   D.cy=D.cy.filter(x=>x!==b.dataset.delCycle);save();renderRoute("ciclo");
  }));
  $("#cycle-to-agenda")?.addEventListener("click",e=>{
   D.ev.push({id:uid(),t:"Menstruação estimada",d:e.currentTarget.dataset.date,k:"Outro",n:"Estimativa do ciclo"});
   save();go("agenda");
  });
 }
 if(route==="servicos"){
  $("#sit")?.addEventListener("change",e=>{
   const v=SERVICE[e.target.value],out=$("#service-result");
   out.innerHTML=v?`<div class="alert-box"><h3>${v[0]}</h3><p>${v[1]}</p></div>`:`<div class="note">Escolha uma situação para ver o próximo passo.</div>`;
  });
 }
 if(route==="consulta"){
  $("#consult-form")?.addEventListener("submit",e=>{
   e.preventDefault();
   ["q1","q2","q3","q4","q5"].forEach(id=>D.q[id]=$("#"+id).value);
   save();$("#consult-status").textContent="Salvo neste aparelho.";
  });
  $("#print-consult")?.addEventListener("click",()=>window.print());
 }
}

$("#btn-menu").addEventListener("click",()=>{
 const open=nav.classList.toggle("open");
 $("#btn-menu").setAttribute("aria-expanded",String(open));
});
$$("#nav a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));

$("#quick-exit").addEventListener("click",()=>{
 // O comportamento de saída rápida é deliberadamente simples: leva para uma tela neutra
 // e substitui o histórico imediato. Não tenta apagar dados, porque isso poderia destruir
 // registros sem confirmação.
 location.replace("about:blank");
});
$("#dlg [data-act='fechar']")?.addEventListener("click",()=>$("#dlg").close());



const S={
 mulher:["Ministério da Saúde — Saúde da Mulher","https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-da-mulher"],
 colo:["Ministério da Saúde — Diretrizes Brasileiras para o Rastreamento do Câncer do Colo do Útero","https://www.gov.br/saude/pt-br/assuntos/pcdt/r/rastreamento-cancer-do-colo-do-utero"],
 mamo:["Ministério da Saúde — Acesso à mamografia a partir dos 40 anos (set/2025)","https://www.gov.br/saude/pt-br/assuntos/noticias/2025/setembro/ministerio-da-saude-garante-acesso-a-mamografia-a-partir-dos-40-anos"],
 mamoInca:["INCA — Nota técnica sobre acesso à mamografia no SUS","https://www.gov.br/inca/pt-br/assuntos/noticias/2025/ministerio-da-saude-padroniza-informacoes-para-acesso-ao-exame-de-mamografia-no-sus"],
 inca:["INCA — Instituto Nacional de Câncer","https://www.gov.br/inca/pt-br"],
 vac:["Ministério da Saúde — Calendário de vacinação","https://www.gov.br/saude/pt-br/vacinacao/calendario"],
 aids:["Ministério da Saúde — Departamento de HIV/Aids, Tuberculose, Hepatites Virais e ISTs","https://www.gov.br/aids/pt-br"],
 meusus:["Meu SUS Digital","https://www.gov.br/saude/pt-br/composicao/seidigi/meususdigital"],
 cnes:["CNES — Cadastro Nacional de Estabelecimentos de Saúde (DATASUS)","https://cnes.datasus.gov.br/"],
 mulheres:["Ministério das Mulheres (Ligue 180)","https://www.gov.br/mulheres/pt-br"],
 mp:["Lei nº 11.340/2006 (Lei Maria da Penha)","https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11340.htm"],
 l12845:["Lei nº 12.845/2013 (atendimento a vítimas de violência sexual)","https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12845.htm"],
 cvv:["CVV — Centro de Valorização da Vida","https://cvv.org.br/"],
 oms:["OMS — Saúde da mulher","https://www.who.int/health-topics/women-s-health"],
 omsPA:["OMS — Atividade física","https://www.who.int/news-room/fact-sheets/detail/physical-activity"],
 trans:["Portaria GM/MS nº 2.803/2013 — Processo Transexualizador no SUS","https://bvsms.saude.gov.br/bvs/saudelegis/gm/2013/prt2803_19_11_2013.html"],
 lgbt:["Portaria GM/MS nº 2.836/2011 — Política Nacional de Saúde Integral LGBT","https://bvsms.saude.gov.br/bvs/saudelegis/gm/2011/prt2836_01_12_2011.html"],
 materna:["Ministério da Saúde — Saúde materna","https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-da-mulher/saude-materna"],
 ms:["Ministério da Saúde","https://www.gov.br/saude/pt-br"]
};
const srcList=(keys)=>`<ul>${keys.map(k=>S[k]?`<li><a href="${S[k][1]}" target="_blank" rel="noopener noreferrer">${esc(S[k][0])}</a></li>`:"").join("")}</ul>`;
const srcInline=keys=>`<p class="src">Fontes: ${keys.map(k=>S[k]?`<a href="${S[k][1]}" target="_blank" rel="noopener noreferrer">${esc(S[k][0])}</a>`:"").filter(Boolean).join("; ")}.</p>`;

/* ============ Biblioteca de conteúdos ============ */
const CATS=["Prevenção","Saúde sexual","Saúde mental","Saúde ginecológica","Câncer","Dermatologia","Mulheres trans","LGBTQIA+","Violência e proteção","SUS"];
const UPD="30/09/2026";
const A=[
{id:"rastreamento-colo-do-utero",t:"Rastreamento do câncer do colo do útero",c:["Câncer","Prevenção","Saúde ginecológica"],
 r:"O SUS está passando do Papanicolau para o teste de DNA-HPV. Entenda para quem é, com que frequência e onde fazer.",
 b:`<p>O câncer do colo do útero está quase sempre ligado à infecção persistente pelo HPV. O rastreamento procura sinais precoces em quem <b>não tem sintomas</b>.</p>
 <h2>O que mudou</h2>
 <p>As diretrizes brasileiras atuais preveem a substituição gradual do Papanicolau pelo <b>teste de DNA-HPV</b> no SUS. A faixa etária de rastreamento é de <b>25 a 64 anos</b> e, com resultado negativo no teste de DNA-HPV, o intervalo de rotina passa a ser de <b>5 anos</b>.</p>
 <p>A implantação acontece aos poucos: a oferta do teste pode variar entre municípios. Pergunte na UBS qual exame está disponível na sua região.</p>
 <h2>Para quem</h2>
 <p>Para <b>mulheres e pessoas com colo do útero</b>: isso inclui mulheres cis, homens trans, pessoas não binárias e pessoas intersexo que tenham colo do útero. Mulheres que se relacionam com mulheres também precisam do rastreamento.</p>
 <h2>Quando procurar antes</h2>
 <p>As recomendações de rotina não se aplicam a quem tem sintomas. Sangramento fora do período menstrual ou após a relação sexual, corrimento diferente do habitual ou dor pélvica persistente merecem avaliação na UBS, mesmo que o exame de rotina esteja em dia.</p>
 <div class="note">O ELLA não interpreta resultados. Leve o laudo à equipe de saúde e pergunte qual é o próximo passo.</div>`,
 s:["colo","inca"],l:["vacinacao","consultas-preventivas","mulheres-trans-saude-sexual"]},

{id:"mamografia",t:"Mamografia e prevenção do câncer de mama",c:["Câncer","Prevenção","Saúde ginecológica"],
 r:"Quem pode fazer mamografia pelo SUS, a cada quanto tempo e quais sinais pedem consulta.",
 b:`<p>A mamografia é o principal exame de rastreamento do câncer de mama.</p>
 <h2>O que o Ministério da Saúde orienta</h2>
 <ul><li><b>50 a 74 anos:</b> rastreamento a cada dois anos, mesmo sem sinais ou sintomas.</li>
 <li><b>40 a 49 anos:</b> acesso ao exame garantido no SUS, a partir de uma decisão conjunta com a(o) profissional de saúde, que explica benefícios e riscos.</li>
 <li><b>Acima de 74 anos:</b> a recomendação é individualizada, considerando condições de saúde.</li></ul>
 <h2>Sinais que pedem consulta em qualquer idade</h2>
 <p>Nódulo na mama ou na axila, mudança na pele da mama, alteração no mamilo ou saída de secreção. Nesses casos o exame passa a ser de investigação, não de rastreamento, e o SUS não restringe o acesso.</p>
 <div class="note">Histórico familiar ou outros fatores de risco mudam a orientação. Converse com a equipe de saúde para definir o seu caso.</div>`,
 s:["mamo","mamoInca","inca"],l:["consultas-preventivas","como-funciona-o-sus"]},

{id:"protecao-solar",t:"Proteção solar e cuidado com a pele",c:["Dermatologia","Câncer","Prevenção"],
 r:"Hábitos simples de proteção e sinais na pele que merecem avaliação profissional.",
 b:`<p>O câncer de pele é o mais frequente no Brasil e, detectado cedo, tem mais chance de tratamento. A prevenção começa nos hábitos do dia a dia.</p>
 <h2>Cuidados básicos</h2>
 <ul><li>Use protetor solar todos os dias nas áreas expostas e reaplique conforme a orientação do produto.</li>
 <li>Evite o sol forte no meio do dia e procure sombra.</li>
 <li>Use chapéu, óculos escuros com proteção UV e roupas que cubram a pele.</li>
 <li>Olhe a sua pele com regularidade, inclusive costas, couro cabeludo, pés e unhas.</li></ul>
 <h2>Sinais que merecem avaliação profissional</h2>
 <p>Pinta ou mancha que muda de forma, cor ou tamanho; ferida que não cicatriza; lesão que coça, sangra ou cresce. Uma forma de lembrar é observar <b>assimetria, bordas irregulares, várias cores, diâmetro grande e evolução</b> ao longo do tempo.</p>
 <div class="note">O ELLA não faz diagnóstico por foto ou descrição. Se algo na sua pele mudou, procure a UBS: a equipe avalia e encaminha ao dermatologista quando necessário.</div>`,
 s:["inca","ms"],l:["consultas-preventivas"]},

{id:"vacinacao",t:"Vacinação: por que ela faz parte do cuidado",c:["Prevenção","SUS","Saúde sexual"],
 r:"Vacinas do SUS que protegem a saúde da mulher, incluindo HPV e hepatite B, e onde consultar o calendário atualizado.",
 b:`<p>Vacinas evitam doenças e complicações. O SUS oferece gratuitamente as vacinas do calendário nacional, que muda conforme novas orientações.</p>
 <h2>HPV e hepatites</h2>
 <p>A vacina contra o HPV está disponível no SUS desde 2014 e protege contra os tipos do vírus mais ligados ao câncer do colo do útero. A vacina contra a hepatite B também faz parte do calendário. Quem pode se vacinar depende da idade e de critérios definidos pelo Ministério da Saúde.</p>
 <h2>Como saber se a sua vacinação está em dia</h2>
 <ul><li>Consulte o calendário oficial (link nas fontes abaixo).</li>
 <li>Veja o seu histórico no app Meu SUS Digital.</li>
 <li>Leve a caderneta de vacinação à UBS e pergunte o que falta.</li></ul>
 <div class="note">Vacinar-se não substitui o rastreamento: o preventivo ou o teste de DNA-HPV continuam importantes.</div>`,
 s:["vac","meusus","colo"],l:["rastreamento-colo-do-utero","ists-visao-geral"]},

{id:"saude-cardiovascular",t:"Cuidado com o coração",c:["Prevenção"],
 r:"Hábitos e acompanhamentos que ajudam a proteger a saúde cardiovascular.",
 b:`<p>Doenças do coração e dos vasos sanguíneos também afetam mulheres, e os sintomas nem sempre são os mais conhecidos.</p>
 <h2>Hábitos que protegem</h2>
 <ul><li>Atividade física regular. A OMS orienta, para adultos, ao menos 150 minutos por semana de atividade moderada, se a sua condição de saúde permitir.</li>
 <li>Alimentação variada, com mais alimentos in natura.</li>
 <li>Não fumar e evitar o consumo excessivo de álcool.</li>
 <li>Cuidar do sono e do estresse.</li></ul>
 <h2>Acompanhamento</h2>
 <p>Medir a pressão arterial e, conforme orientação profissional, avaliar glicemia e colesterol. A frequência depende da idade, do histórico familiar e de outras condições. Não há uma lista única de exames para todas as mulheres.</p>
 <p><b>Dor forte no peito, falta de ar súbita ou desmaio</b> são urgência: ligue 192.</p>`,
 s:["omsPA","ms"],l:["consultas-preventivas"]},

{id:"saude-ossea",t:"Saúde dos ossos",c:["Prevenção"],
 r:"Cuidados ao longo da vida para manter os ossos fortes e quando conversar com um profissional.",
 b:`<p>Os ossos ganham massa até a vida adulta jovem e podem perdê-la com o tempo, principalmente após a menopausa.</p>
 <h2>O que ajuda</h2>
 <ul><li>Atividade física com carga e fortalecimento muscular.</li>
 <li>Alimentação com fontes de cálcio e exposição solar em horários seguros, que ajuda o corpo a produzir vitamina D.</li>
 <li>Não fumar e reduzir o álcool.</li></ul>
 <h2>Exames</h2>
 <p>A densitometria óssea e outros exames são indicados conforme idade, histórico e fatores de risco. Quem define é o profissional de saúde; não existe indicação igual para todas.</p>`,
 s:["omsPA","ms"],l:["consultas-preventivas"]},

{id:"consultas-preventivas",t:"Consultas preventivas: como aproveitar",c:["Prevenção","SUS","Saúde ginecológica"],
 r:"O que levar, o que perguntar e como organizar o retorno.",
 b:`<p>A porta de entrada do SUS é a Unidade Básica de Saúde (UBS). Lá é possível fazer acompanhamento de rotina, vacinação, pré-natal, prevenção e encaminhamento a especialistas.</p>
 <h2>O que levar</h2>
 <ul><li>Documento com foto e, se tiver, cartão do SUS.</li><li>Exames e receitas anteriores.</li><li>Caderneta de vacinação.</li></ul>
 <h2>O que anotar antes</h2>
 <ul><li>O que a trouxe à consulta e há quanto tempo.</li><li>Data da última menstruação e dos últimos exames preventivos.</li><li>Medicamentos em uso, alergias e histórico na família.</li><li>Suas dúvidas.</li></ul>
 <h2>Ao final</h2>
 <p>Pergunte: qual é o próximo passo, quando devo voltar e quando saem os resultados? Registre as respostas no calendário da área <a href="#/minha-saude/calendario">Minha Saúde</a>.</p>
 <p>Você tem direito a privacidade, a respeito ao seu nome social e a atendimento sem discriminação.</p>`,
 s:["meusus","mulher"],l:["como-funciona-o-sus","rastreamento-colo-do-utero"]},

{id:"ists-visao-geral",t:"ISTs: transmissão, prevenção e testagem",c:["Saúde sexual","Prevenção","SUS"],
 r:"HIV, sífilis, HPV, hepatites virais e gonorreia: o essencial sobre cada uma e por que testar.",
 b:`<p>Infecções sexualmente transmissíveis (ISTs) podem não dar sintomas por muito tempo. Por isso, testar é uma forma de cuidado, não de suspeita.</p>
 <h2>HIV</h2><p>Transmite-se por sexo sem preservativo, por sangue e da gestante para o bebê. Há teste rápido no SUS. A prevenção combina preservativo, PrEP (profilaxia antes da exposição), PEP (profilaxia após exposição, que deve começar o quanto antes, em até 72 horas) e tratamento. Pessoas em tratamento com carga viral indetectável não transmitem o HIV por via sexual.</p>
 <h2>Sífilis</h2><p>Transmitida por sexo e da gestante para o bebê. Tem cura e o teste rápido está disponível nos serviços de saúde. Sem tratamento, pode causar complicações graves.</p>
 <h2>HPV</h2><p>Vírus muito comum, transmitido por contato íntimo, inclusive pele com pele. A vacina é a principal prevenção; o preservativo protege parcialmente. Veja também o <a href="#/conteudos/rastreamento-colo-do-utero">rastreamento do colo do útero</a>.</p>
 <h2>Hepatites virais</h2><p>A hepatite B tem vacina no SUS e pode ser transmitida por sexo e sangue. A hepatite C não tem vacina, mas tem tratamento no SUS. Peça a testagem.</p>
 <h2>Gonorreia e outras</h2><p>A gonorreia é causada por bactéria e pode não dar sintomas. O tratamento exige avaliação e receita profissional; não use antibióticos por conta própria.</p>
 <div class="note">Corrimento diferente, verrugas, feridas, dor ao urinar ou dor na relação: procure a UBS. Testagem e tratamento no SUS são gratuitos e sigilosos.</div>`,
 s:["aids","vac"],l:["contracepcao","sexo-entre-mulheres","vacinacao"]},

{id:"contracepcao",t:"Métodos contraceptivos: visão geral",c:["Saúde sexual","Saúde ginecológica","SUS"],
 r:"Não existe método melhor para todas. Veja os grupos de métodos e como decidir com um profissional.",
 b:`<p>A escolha do método depende da sua saúde, do seu momento de vida, dos seus objetivos e das suas preferências. <b>Nenhum método é o melhor para todas as mulheres.</b></p>
 <h2>Grupos de métodos</h2>
 <ul><li><b>De barreira:</b> preservativo masculino e feminino. É o único que também protege contra ISTs.</li>
 <li><b>Hormonais:</b> como pílulas e injetáveis.</li>
 <li><b>Dispositivos intrauterinos (DIU).</b></li>
 <li><b>Definitivos:</b> esterilização, com regras previstas na legislação de planejamento familiar.</li>
 <li><b>Contracepção de emergência:</b> uso pontual após relação sem proteção; procure o serviço de saúde o quanto antes.</li></ul>
 <p>Os métodos disponíveis variam por serviço. Pergunte na UBS o que é ofertado na sua região.</p>
 <div class="note">Estimativas de ciclo menstrual, inclusive as do ELLA, não servem como método contraceptivo.</div>`,
 s:["mulher","aids"],l:["ists-visao-geral","consentimento-e-seguranca"]},

{id:"sexo-entre-mulheres",t:"Saúde sexual de mulheres que se relacionam com mulheres",c:["Saúde sexual","LGBTQIA+","Saúde ginecológica"],
 r:"Relacionar-se com mulheres não elimina a necessidade de prevenção, testagem e consultas.",
 b:`<p>É comum ouvir que mulheres que se relacionam com mulheres não precisam de cuidados preventivos. Isso não é verdade.</p>
 <ul><li><b>ISTs:</b> podem ser transmitidas entre mulheres, por contato genital, fluidos, compartilhamento de objetos sexuais sem proteção e contato pele com pele. Barreiras de proteção e higiene de objetos ajudam a reduzir o risco.</li>
 <li><b>Testagem:</b> vale para toda pessoa sexualmente ativa, independentemente da orientação sexual.</li>
 <li><b>Vacinação:</b> HPV e hepatite B, conforme o calendário.</li>
 <li><b>Colo do útero:</b> o rastreamento vale para quem tem colo do útero, inclusive quem nunca teve relações com homens.</li>
 <li><b>Consultas:</b> você pode dizer à equipe com quem se relaciona; isso ajuda a orientar melhor, e você tem direito a atendimento sem discriminação.</li>
 <li><b>Comunicação e consentimento:</b> converse sobre limites, testagem e proteção com sua parceira.</li></ul>`,
 s:["aids","lgbt","colo"],l:["ists-visao-geral","consentimento-e-seguranca","saude-integral-lgbtqia"]},

{id:"consentimento-e-seguranca",t:"Consentimento, limites e relações saudáveis",c:["Saúde sexual","Violência e proteção"],
 r:"O que é consentimento, como reconhecer pressão e onde buscar ajuda.",
 b:`<p><b>Consentimento</b> é um “sim” livre, informado e específico, que pode ser retirado a qualquer momento. Silêncio, medo, sono, uso de álcool ou outras drogas e insistência não são consentimento.</p>
 <h2>Sinais de uma relação respeitosa</h2>
 <ul><li>Você pode dizer “não” sem medo de retaliação.</li><li>Seus limites são respeitados, inclusive sobre proteção e testagem.</li><li>Ninguém controla sua roupa, seus contatos ou seu celular.</li></ul>
 <h2>Pressão para atos sexuais</h2>
 <p>Ser pressionada, chantageada ou ameaçada para ter relações ou para enviar imagens íntimas não é culpa sua. Você não precisa lidar sozinha: converse com uma pessoa de confiança e procure a rede de apoio.</p>
 <h2>Em caso de violência sexual</h2>
 <p>Procure uma UBS, UPA ou hospital o quanto antes. Há atendimento de saúde previsto em lei, incluindo prevenção de ISTs e da gravidez, e a profilaxia do HIV é mais eficaz quando iniciada logo. Você não precisa fazer boletim de ocorrência para ser atendida na saúde. O <b>Ligue 180</b> orienta sobre a rede de proteção.</p>`,
 s:["l12845","mulheres","mp"],l:["tipos-de-violencia","rede-de-apoio"]},

{id:"saude-mental-cuidado",t:"Saúde mental: cuidar da mente também é prevenção",c:["Saúde mental"],
 r:"Ansiedade, estresse, tristeza, autoestima e isolamento: quando procurar ajuda profissional.",
 b:`<p>Sentir ansiedade, cansaço ou tristeza faz parte da vida. Vale buscar apoio quando esses sentimentos duram, atrapalham o sono, o trabalho, as relações ou fazem você se afastar das pessoas.</p>
 <h2>Sinais de que vale conversar com um profissional</h2>
 <ul><li>Tristeza ou ansiedade que não passam.</li><li>Insônia ou sono em excesso, perda de interesse pelo que gostava.</li><li>Isolamento, sensação de pressão constante ou medo de alguém próximo.</li><li>Pensamentos de se machucar ou de morrer.</li></ul>
 <h2>Por onde começar</h2>
 <ul><li><b>UBS:</b> a equipe acolhe e pode encaminhar.</li><li><b>CAPS:</b> Centro de Atenção Psicossocial, serviço do SUS para sofrimento psíquico.</li><li><b>CVV, 188:</b> conversa gratuita e sigilosa, 24 horas.</li></ul>
 <div class="alert-box"><b>Se você está pensando em se machucar ou tirar a própria vida:</b> ligue 188 (CVV) ou 192 (SAMU), ou vá a uma UPA. Se puder, fale com alguém de confiança agora.</div>
 <p>O ELLA não faz diagnóstico de saúde mental.</p>`,
 s:["cvv","ms"],l:["tipos-de-violencia","rede-de-apoio"]},

{id:"tipos-de-violencia",t:"Tipos de violência contra a mulher e sinais de alerta",c:["Violência e proteção","Saúde mental"],
 r:"Física, psicológica, sexual, patrimonial, moral e digital: como reconhecer, sem culpa.",
 b:`<p><b>A culpa nunca é da vítima.</b> A Lei Maria da Penha reconhece cinco formas de violência doméstica e familiar contra a mulher:</p>
 <ul><li><b>Física:</b> agressões, empurrões, sufocamento, qualquer ato que ofenda o corpo.</li>
 <li><b>Psicológica:</b> humilhação, ameaça, isolamento, controle, perseguição, manipulação.</li>
 <li><b>Sexual:</b> forçar relação ou atos sexuais, impedir uso de proteção ou de contracepção.</li>
 <li><b>Patrimonial:</b> reter documentos, destruir bens, controlar ou tirar o seu dinheiro.</li>
 <li><b>Moral:</b> calúnia, difamação, injúria.</li></ul>
 <h2>No ambiente digital</h2>
 <p>Vigiar mensagens e localização, exigir senhas, ameaçar divulgar imagens íntimas ou fazer ofensas em redes também são formas de violência e podem ser denunciados.</p>
 <h2>Sinais de alerta</h2>
 <p>Medo de reagir, de contrariar, de ficar sozinha com a pessoa; afastamento de amigos e família; controle de horários, roupas e dinheiro; ameaças; pedidos de desculpa seguidos de novas agressões.</p>
 <p>Se você se reconhece em algum ponto, procure a <a href="#/saude-mental-protecao">rede de apoio</a> ou ligue <b>180</b>.</p>`,
 s:["mp","mulheres"],l:["rede-de-apoio","consentimento-e-seguranca"]},

{id:"rede-de-apoio",t:"Rede de apoio e proteção: para onde ir",c:["Violência e proteção","SUS"],
 r:"Canais oficiais de atendimento e como buscar ajuda com segurança.",
 b:`<ul><li><b>Ligue 180:</b> Central de Atendimento à Mulher. Gratuito, orienta sobre direitos, denúncia e rede de proteção.</li>
 <li><b>190:</b> Polícia Militar, em perigo imediato.</li><li><b>192:</b> SAMU, emergência de saúde.</li>
 <li><b>188:</b> CVV, apoio emocional.</li><li><b>Disque 100:</b> denúncias de violações de direitos humanos.</li></ul>
 <h2>Serviços presenciais</h2>
 <ul><li><b>UBS, UPA e hospitais:</b> atendimento de saúde, inclusive a vítimas de violência sexual.</li>
 <li><b>Delegacia da Mulher (DEAM)</b>, quando existir na sua cidade, ou qualquer delegacia.</li>
 <li><b>CRAS e CREAS:</b> assistência social. <b>CAPS:</b> saúde mental.</li></ul>
 <h2>Com segurança</h2>
 <p>Se alguém controla seu aparelho, use o botão <b>Sair rápido</b> e limpe o histórico do navegador. Combine com uma pessoa de confiança uma palavra que signifique “preciso de ajuda”.</p>
 <div class="note">Confira sempre os contatos locais em fontes oficiais. O ELLA não mantém telefones próprios de serviços da sua cidade.</div>`,
 s:["mulheres","mp","l12845"],l:["tipos-de-violencia","consentimento-e-seguranca"]},

{id:"mulheres-trans-hormonio",t:"Terapia hormonal: informação e acompanhamento",c:["Mulheres trans","LGBTQIA+"],
 r:"O que é terapia hormonal, por que o acompanhamento importa e os riscos de usar hormônios por conta própria.",
 b:`<p>A terapia hormonal é um tratamento em que hormônios são usados para aproximar características do corpo da identidade de gênero. O cuidado é <b>individualizado</b> e deve ser feito por profissionais qualificados.</p>
 <h2>Por que o acompanhamento importa</h2>
 <ul><li>A avaliação considera saúde geral, histórico, outros medicamentos e objetivos da pessoa.</li>
 <li>É preciso <b>acompanhamento periódico</b> para observar efeitos, cuidados necessários e possíveis complicações.</li>
 <li>Efeitos e riscos variam de pessoa para pessoa e são explicados pela equipe.</li></ul>
 <h2>Riscos de usar sem acompanhamento</h2>
 <p>Usar hormônios sem prescrição e monitoramento pode trazer riscos à saúde, incluindo interações com outros medicamentos e problemas que passam despercebidos. Silicone industrial e outras substâncias sem controle também oferecem riscos sérios.</p>
 <div class="note">O ELLA não informa doses, esquemas ou instruções de uso de medicamentos. Procure serviço de saúde, no SUS ou especializado, para orientação individual.</div>`,
 s:["trans","lgbt"],l:["mulheres-trans-acesso","mulheres-trans-saude-sexual"]},

{id:"mulheres-trans-acesso",t:"Mulheres trans: caminhos de acesso à saúde no SUS",c:["Mulheres trans","SUS","LGBTQIA+"],
 r:"Atendimento na UBS, serviços especializados e o Processo Transexualizador, com a ressalva de que a oferta varia.",
 b:`<h2>Comece pela UBS</h2>
 <p>A UBS oferece cuidados gerais, prevenção, testagem, vacinação e pode encaminhar a serviços especializados. Você tem direito ao uso do <b>nome social</b> no atendimento do SUS.</p>
 <h2>Serviços especializados</h2>
 <p>O SUS possui o <b>Processo Transexualizador</b>, com acompanhamento multiprofissional, e a Política Nacional de Saúde Integral LGBT. A rede é regulada por normas do Ministério da Saúde que podem mudar.</p>
 <h2>Cirurgias e procedimentos</h2>
 <p>Existem procedimentos relacionados à afirmação de gênero, que exigem avaliação e acompanhamento profissional. O acesso pela rede pública depende do que está previsto nas políticas vigentes e <b>da oferta em cada estado e cidade</b>. O ELLA não pode garantir que determinado procedimento esteja disponível na sua localidade: consulte sempre as fontes oficiais atualizadas e a secretaria de saúde.</p>
 <p>Se sofrer discriminação no atendimento, registre na Ouvidoria do SUS (136).</p>`,
 s:["trans","lgbt","ms"],l:["mulheres-trans-hormonio","saude-integral-lgbtqia"]},

{id:"mulheres-trans-saude-sexual",t:"Saúde sexual e prevenção para mulheres trans",c:["Mulheres trans","Saúde sexual","LGBTQIA+"],
 r:"Prevenção de ISTs, testagem, vacinação e acompanhamento conforme a sua anatomia, não só a identidade de gênero.",
 b:`<ul><li><b>ISTs:</b> preservativo, testagem regular, PrEP e PEP para HIV, tratamento quando necessário. Veja <a href="#/conteudos/ists-visao-geral">ISTs</a>.</li>
 <li><b>Vacinação:</b> HPV e hepatite B conforme o calendário.</li>
 <li><b>Acompanhamento conforme a anatomia:</b> algumas orientações dependem dos órgãos que a pessoa tem, e não da identidade de gênero. Por isso, o ELLA usa a expressão <b>“mulheres e pessoas com colo do útero”</b> quando a informação se refere ao colo do útero.</li>
 <li><b>Conversa com a equipe:</b> você pode contar sobre sua história e, se desejar, sobre o uso de hormônios para que a orientação seja mais adequada.</li></ul>`,
 s:["aids","colo","lgbt"],l:["ists-visao-geral","mulheres-trans-hormonio"]},

{id:"saude-integral-lgbtqia",t:"Saúde integral de pessoas LGBTQIA+ no SUS",c:["LGBTQIA+","SUS","Mulheres trans"],
 r:"Direito a atendimento sem discriminação e o que a política nacional prevê.",
 b:`<p>A Política Nacional de Saúde Integral de Lésbicas, Gays, Bissexuais, Travestis e Transexuais (Portaria GM/MS nº 2.836/2011) reconhece que a discriminação e o preconceito afetam a saúde e o acesso ao cuidado.</p>
 <ul><li>Atendimento respeitoso, com nome social.</li><li>Prevenção e cuidado em saúde sexual.</li><li>Acesso a serviços de saúde mental e proteção contra violência.</li></ul>
 <p>Você tem direito a ser atendida sem discriminação. Em caso de desrespeito, registre reclamação na Ouvidoria do SUS (136) ou na secretaria de saúde.</p>`,
 s:["lgbt","ms"],l:["mulheres-trans-acesso","sexo-entre-mulheres"]},

{id:"como-funciona-o-sus",t:"Como funciona o SUS: por onde começar",c:["SUS","Prevenção"],
 r:"UBS, UPA, hospitais e ferramentas oficiais, para saber a quem recorrer em cada situação.",
 b:`<ul><li><b>UBS:</b> porta de entrada. Consultas, vacinas, preventivo, pré-natal, testagem, encaminhamentos.</li>
 <li><b>UPA e pronto-socorro:</b> urgências. <b>SAMU (192):</b> emergência.</li>
 <li><b>Hospitais e maternidades:</b> internação, parto, procedimentos.</li>
 <li><b>CAPS:</b> saúde mental. <b>Serviços especializados:</b> por encaminhamento.</li></ul>
 <h2>Ferramentas oficiais</h2>
 <ul><li><a href="https://www.gov.br/saude/pt-br/composicao/seidigi/meususdigital" target="_blank" rel="noopener noreferrer">Meu SUS Digital</a>: histórico de vacinas, exames e atendimentos.</li>
 <li><a href="https://cnes.datasus.gov.br/" target="_blank" rel="noopener noreferrer">CNES</a>: cadastro oficial de estabelecimentos de saúde.</li>
 <li>Ouvidoria do SUS: <b>136</b>, para reclamações, elogios e denúncias.</li></ul>`,
 s:["meusus","cnes","ms"],l:["consultas-preventivas"]},

{id:"gestacao-perda-gestacional",t:"Perda gestacional: acolhimento, sinais de alerta e direitos",c:["Saúde ginecológica","SUS"],
 r:"Informação básica e acolhedora. As condutas clínicas são decididas pela equipe de saúde.",
 b:`<p>Perder uma gravidez acontece com muitas mulheres e pessoas com útero, e merece acolhimento, sem julgamento.</p>
 <div class="alert-box"><b>Procure atendimento agora</b> (UPA, hospital ou SAMU 192) se, durante a gravidez, houver sangramento intenso, dor forte, febre, tontura ou mal-estar intenso.</div>
 <h2>O que é abortamento</h2>
 <p>É a interrupção da gravidez antes de o bebê ter condições de sobreviver fora do útero. Pode ser espontâneo ou provocado. Na maioria dos casos espontâneos no início da gestação, há causa genética; outros fatores também podem estar envolvidos.</p>
 <h2>O que a equipe de saúde faz</h2>
 <p>A conduta depende de cada caso: avaliação clínica, exames, acompanhamento do sangramento, cuidado com infecção e apoio psicológico. Isso <b>não é orientação para tratar em casa</b>.</p>
 <h2>Seus direitos</h2>
 <p>Em qualquer situação de abortamento, você tem direito a atendimento humanizado e ao sigilo profissional. O Código Penal (art. 128) prevê aborto legal em caso de risco de vida da gestante e de gravidez resultante de estupro; o SUS atende também casos previstos pelo STF, como anencefalia fetal. Fora dessas situações, a lei prevê pena. Em caso de violência sexual, veja a <a href="#/conteudos/rede-de-apoio">rede de apoio</a>.</p>
 <div class="note">Sentir tristeza é comum. Conte com apoio psicológico na UBS ou no CAPS. Este texto é uma visão geral: confirme condutas e prazos com a equipe e nas normas atuais do Ministério da Saúde.</div>`,
 s:["materna","l12845","ms"],l:["saude-mental-cuidado","rede-de-apoio"]}
];
const FAQ=[
["O ELLA faz diagnóstico?","Não. O ELLA reúne informação e ajuda você a se organizar. Diagnóstico e tratamento só podem ser feitos por profissionais de saúde."],
["O ELLA interpreta o resultado do meu exame?","Não. Ele apenas guarda o registro. Dúvidas sobre resultado devem ser conversadas com um profissional de saúde."],
["Meus dados estão seguros?","Neste protótipo, tudo fica só no seu navegador, neste aparelho, e não é enviado a nenhum servidor. Por isso, use apenas dados fictícios até existir uma estrutura segura de produção."],
["Preciso pagar para usar o SUS?","O SUS é gratuito. Consultas, vacinas do calendário, preservativos, testagem e o preventivo nas UBS não têm custo."],
["Onde faço o preventivo?","Na UBS. Pergunte qual exame de rastreamento do colo do útero está disponível na sua região."],
["Posso ser atendida se não tenho o cartão do SUS?","Você pode ser atendida em situações de urgência e, na UBS, pode fazer o cadastro. Leve documento com foto."]
];

/* Inicialização: ocorre depois de carregar toda a biblioteca de conteúdos. */
if(!location.hash) history.replaceState(null,"","#/inicio");
renderRoute(currentRoute());
