const V=[["inicio","Início"],["agenda","Agenda"],["ciclo","Ciclo"],["prevencao","Prevenção"],["gestacao","Gestação"],["servicos","Serviços"],["consulta","Consulta"],["apoio","Apoio"]];
const D={ev:[],cy:[],q:{}};
try{Object.assign(D,JSON.parse(localStorage.getItem("ella")||"{}"))}catch(e){}
const save=()=>{try{localStorage.setItem("ella",JSON.stringify(D))}catch(e){}};
const $=i=>document.getElementById(i);
const fmt=d=>new Date(d+"T12:00").toLocaleDateString("pt-BR");
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const today=()=>new Date().toISOString().slice(0,10);
function go(id){document.querySelectorAll(".view").forEach(v=>v.classList.toggle("on",v.id===id));
document.querySelectorAll("#nav button").forEach(b=>b.setAttribute("aria-current",b.dataset.v===id));scrollTo(0,0)}
$("nav").innerHTML=V.map(v=>`<button data-v="${v[0]}" onclick="go('${v[0]}')">${v[1]}</button>`).join("");
$("atalhos").innerHTML=[["agenda","Agenda de cuidados","Exames, consultas e vacinas com data."],["ciclo","Meu ciclo","Registre e veja a estimativa do próximo."],["prevencao","Prevenção","Preventivo, mama, pele e HPV."],["gestacao","Gestação e perda gestacional","Tipos, sinais de alerta, cuidados e direitos."],["servicos","Onde ir","Qual serviço do SUS procurar."],["consulta","Preparar consulta","Anote dúvidas antes de ir."],["apoio","Apoio e segurança","Violência, saúde mental, telefones."]].map(a=>`<button class="card go" onclick="go('${a[0]}')"><h3>${a[1]}</h3><p>${a[2]}</p></button>`).join("");
function addEv(){const t=$("et").value.trim(),d=$("ed").value;if(!t||!d){alert("Preencha o nome e a data.");return}
D.ev.push({t,d,k:$("ek").value,n:$("en").value.trim(),id:Date.now()});save();$("et").value=$("en").value="";rEv()}
function delEv(id){D.ev=D.ev.filter(e=>e.id!==id);save();rEv()}
function li(e){const dias=Math.round((new Date(e.d+"T12:00")-new Date(today()+"T12:00"))/864e5);
const q=dias<0?"passou":dias===0?"hoje":dias===1?"amanhã":`em ${dias} dias`;
return `<li><div><b>${esc(e.t)}</b> <span class="pill">${e.k}</span><small>${fmt(e.d)} · ${q}${e.n?" · "+esc(e.n):""}</small></div><button class="x" aria-label="Apagar ${esc(e.t)}" onclick="delEv(${e.id})">×</button></li>`}
function rEv(){const s=[...D.ev].sort((a,b)=>a.d.localeCompare(b.d));
$("evs").innerHTML=s.length?s.map(li).join(""):"<li>Sua agenda está vazia. Adicione o próximo exame ou consulta.</li>";
const p=s.filter(e=>e.d>=today()).slice(0,3);
$("prox").innerHTML=p.length?p.map(li).join(""):"<li>Nada agendado. <button class='btn alt' style='margin:0' onclick=\"go('agenda')\">Adicionar lembrete</button></li>"}
function addCy(){const d=$("cd").value;if(!d)return;if(!D.cy.includes(d))D.cy.push(d);D.cy.sort();save();rCy()}
function delCy(d){D.cy=D.cy.filter(x=>x!==d);save();rCy()}
function rCy(){const c=D.cy;let h="Nenhum registro ainda.";
if(c.length===1)h="Registre mais um início de menstruação para calcular seu ciclo.";
if(c.length>1){const g=[];for(let i=1;i<c.length;i++)g.push(Math.round((new Date(c[i])-new Date(c[i-1]))/864e5));
const m=Math.round(g.reduce((a,b)=>a+b,0)/g.length);const n=new Date(new Date(c[c.length-1]+"T12:00").getTime()+m*864e5).toISOString().slice(0,10);
h=`<div class="big">${m} dias</div>duração média do ciclo (${g.length} ${g.length>1?"ciclos":"ciclo"}).<br>Próxima menstruação estimada: <b>${fmt(n)}</b>.<br><button class="btn alt" onclick="cyToAg('${n}')">Criar lembrete na agenda</button>`}
$("cres").innerHTML=h;
$("cys").innerHTML=[...c].reverse().map(d=>`<li><span>${fmt(d)}</span><button class="x" aria-label="Apagar ${fmt(d)}" onclick="delCy('${d}')">×</button></li>`).join("")}
function cyToAg(n){D.ev.push({t:"Menstruação estimada",d:n,k:"Outro",n:"",id:Date.now()});save();rEv();go("agenda")}
const SV={a:"<h3>Unidade Básica de Saúde (UBS)</h3><p>Vá à UBS mais próxima da sua casa. O preventivo é feito lá, por médica(o) ou enfermeira(o), sem custo. Se ainda não tem cadastro, leve documento com foto e comprovante de endereço.</p>",
b:"<h3>UBS, o quanto antes</h3><p>Corrimento, odor forte e lesões ou verrugas na vulva ou vagina devem ser avaliados na atenção primária o mais rápido possível. A equipe examina, trata e encaminha ao especialista se for preciso.</p>",
c:"<h3>UBS</h3><p>Vacinas do calendário (incluindo HPV) e preservativos masculinos e femininos estão disponíveis nas unidades de atenção primária. <a href='https://www.gov.br/saude/pt-br/vacinacao/calendario' target='_blank' rel='noopener'>Ver calendário</a>.</p>",
d:"<h3>UBS: pré-natal</h3><p>Toda mulher tem direito a atendimento na gravidez, no parto e após o parto. Procure a UBS para começar o pré-natal. Em sangramento, dor forte ou febre, vá a uma UPA ou ligue 192. <a href='https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-da-mulher/saude-materna' target='_blank' rel='noopener'>Saúde materna</a>.</p>",
e:"<h3>Peça ajuda agora</h3><p>Perigo imediato: <b>190</b>. Orientação e denúncia: <b>Ligue 180</b>. Violência sexual: procure UBS ou hospital, onde há atendimento de saúde. <a href='#' onclick=\"go('apoio');return false\">Ver página de apoio</a>.</p>",
f:"<h3>UBS, CAPS ou CVV</h3><p>Para conversar agora, ligue <b>188</b> (CVV). Para acompanhamento, comece pela UBS, que pode encaminhar ao CAPS. Em risco imediato, ligue 192.</p>",
h:"<h3>Vá a uma UPA ou hospital</h3><p>Sangramento, dor forte, febre ou tontura na gravidez precisam de avaliação rápida. Ligue 192 (SAMU) se estiver muito mal. Você tem direito a atendimento sem julgamento. <a href='#' onclick=\"go('gestacao');return false\">Saiba mais</a>.</p>",
g:"<h3>Volte à UBS que pediu o exame</h3><p>Leve o resultado. Repetição de exame, colposcopia ou outros passos dependem do laudo, e quem decide é a equipe de saúde. Registre o retorno na sua Agenda.</p>"};
function showSv(){$("svr").innerHTML=SV[$("sit").value]||"Escolha uma situação para ver o próximo passo."}
function saveQ(){["q1","q2","q3","q4"].forEach(i=>D.q[i]=$(i).value);save();$("qs").textContent="Salvo neste aparelho."}
["q1","q2","q3","q4"].forEach(i=>$(i).value=D.q[i]||"");
rEv();rCy();go("inicio");
