// GERADO por "npm run sync:app" no painel PetGo360 a partir de shared/centralDenuncia/estilo.ts — NÃO EDITAR AQUI.
// Estilo da CENTRAL DE DENÚNCIAS (modelo 6 escolhido pelo dono): claro e ESCURO AZUL (padrão das aplicações), cores do PetGo
// (roxo #6B46C1, laranja #EA534A, verde-água #06B197), selos e botões com 7px/10px. Escopo `.cdp` (não vaza para o resto).
export const CSS_CENTRAL = `
.cdp{--cdp-fundo:#F4F6FA;--cdp-card:#fff;--cdp-borda:#E6E8EF;--cdp-linha:#EEF0F5;--cdp-txt:#1E2A44;--cdp-sub:#5B6478;--cdp-fraco:#8A92A6;--cdp-sel:#F3EEFF;
  --cdp-inp:#fff;--cdp-bolha:#F1F0F6;--cdp-ativo:#6B46C1;font-family:Nunito,"IBM Plex Sans",Segoe UI,sans-serif;color:var(--cdp-txt);background:var(--cdp-fundo);
  border-radius:16px;padding:14px;font-size:14px;line-height:1.4}
.cdp{--cdp-solido:#F4F6FA}
.cdp.cdp-escuro{--cdp-solido:#0a1630;--cdp-fundo:transparent;--cdp-card:#0e1b3b;--cdp-borda:#1b2f5c;--cdp-linha:#16295a;--cdp-txt:#eaf2ff;--cdp-sub:#8fa6d6;--cdp-fraco:#6f86b8;--cdp-sel:#1b2c5e;
  --cdp-inp:#0a1630;--cdp-bolha:#1b2c5e;--cdp-ativo:#b9a4ff}
.cdp *{box-sizing:border-box}
.cdp h1,.cdp h2{margin:0;color:var(--cdp-txt)}
.cdp h2{font-size:18px}.cdp-h1{font-size:20px;font-weight:800;line-height:1.25}
.cdp-titulo{margin:0 2px 10px;font-size:16px}
.cdp-sub{color:var(--cdp-sub);font-size:12.5px}.cdp-fraco{color:var(--cdp-fraco);font-size:12.5px}
.cdp-rot{color:var(--cdp-sub);font-size:12px;font-weight:800;letter-spacing:.04em;margin-bottom:8px}
.cdp-linha{display:flex;justify-content:space-between;align-items:center;gap:6px}
.cdp-card{background:var(--cdp-card);border:1px solid var(--cdp-borda);border-radius:16px}
.cdp-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:12px}
.cdp-kpi{border:1px solid var(--cdp-borda);border-radius:16px;padding:12px 16px}.cdp-kpi-v{font-size:27px;font-weight:800;line-height:1.15;color:var(--cdp-txt)}
.cdp-corpo{display:grid;grid-template-columns:360px minmax(0,1fr) 310px;gap:12px;height:calc(100vh - var(--cdp-desconto, 250px));min-height:520px}
.cdp-fila{padding:14px;display:flex;flex-direction:column;min-height:0}
.cdp-rolagem{overflow:auto;flex:1;min-height:0;padding-right:2px}
.cdp-input{width:100%;background:var(--cdp-inp);border:1px solid var(--cdp-borda);border-radius:10px;padding:9px 12px;color:var(--cdp-txt);font:inherit;outline:none}
.cdp-input:focus{border-color:#6B46C1}
.cdp-fila .cdp-input{margin:10px 0}
.cdp-chips{display:flex;gap:6px;flex-wrap:wrap}
.cdp-chip{background:var(--cdp-card);border:1px solid var(--cdp-borda);color:var(--cdp-sub);border-radius:7px;padding:5px 10px;font:inherit;font-size:12px;font-weight:700;cursor:pointer}
.cdp-chip.on{background:#6B46C1;border-color:#6B46C1;color:#fff}
.cdp-fila .cdp-chips{margin-bottom:10px}
.cdp-pill{display:inline-flex;align-items:center;padding:3px 9px;border-radius:7px;font-size:12px;font-weight:700;white-space:nowrap}
.cdp-cartao{display:block;width:100%;text-align:left;background:var(--cdp-card);border:1px solid var(--cdp-borda);border-left:4px solid #F59E0B;border-radius:12px;padding:10px 12px;margin-bottom:8px;cursor:pointer;font:inherit;color:var(--cdp-txt)}
.cdp-cartao:hover{border-color:#6B46C155}.cdp-cartao.sel{background:var(--cdp-sel);border-color:#6B46C1}
.cdp-cartao b{font-size:13.5px}.cdp-corta{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:3px 0 6px}
.cdp-centro{display:flex;flex-direction:column;gap:12px;min-width:0;min-height:0}
.cdp-vazio{padding:40px;text-align:center;color:var(--cdp-sub)}
.cdp-acoes{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}
.cdp-btn{border:1px solid var(--cdp-borda);background:var(--cdp-card);color:var(--cdp-txt);border-radius:10px;padding:8px 13px;font:inherit;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap}
.cdp-btn:disabled{opacity:.5;cursor:not-allowed}
.cdp-btn-p{background:#6B46C1;border-color:#6B46C1;color:#fff}.cdp-btn-suave{background:#6B46C122;border-color:transparent;color:var(--cdp-ativo)}
.cdp-btn-ok{background:#06B19722;border-color:transparent;color:#06B197}
.cdp-etapas{display:flex;align-items:center;margin-top:14px}
.cdp-etapa{display:flex;align-items:center}.cdp-etapa b{margin:0 10px;font-size:13px;white-space:nowrap}
.cdp-bola{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:13px;flex:none}
.cdp-traco{flex:1;height:3px;border-radius:3px;min-width:20px}
.cdp-aviso{margin-top:12px;background:#06B19718;color:#06B197;border-radius:10px;padding:8px 12px;font-weight:700;font-size:13px}
.cdp-painel{flex:1;display:flex;flex-direction:column;min-height:0;overflow:hidden}
.cdp-abas{display:flex;gap:4px;padding:0 14px;border-bottom:1px solid var(--cdp-linha);flex:none}
.cdp-abas button{background:none;border:0;border-bottom:3px solid transparent;padding:12px;font:inherit;font-weight:800;color:var(--cdp-sub);cursor:pointer}
.cdp-abas button.on{color:var(--cdp-ativo);border-bottom-color:#6B46C1}
.cdp-relato{padding:14px 20px;border-bottom:1px solid var(--cdp-linha);flex:none;max-height:42%;overflow:auto}
.cdp-relato p{margin:4px 0 8px;font-size:14.5px;line-height:1.5}
.cdp-fotos{display:flex;gap:8px;flex-wrap:wrap}.cdp-foto{width:104px;height:76px;object-fit:cover;border-radius:12px;display:block;background:#000}
.cdp-pad{padding:16px 20px;overflow:auto}
.cdp-conversa{flex:1;display:flex;flex-direction:column;min-height:0}
.cdp-msgs{flex:1;overflow:auto;padding:14px 20px;min-height:0}
.cdp-bolha{max-width:72%;width:fit-content;background:var(--cdp-bolha);color:var(--cdp-txt);padding:9px 12px;border-radius:14px 14px 14px 4px;margin-bottom:8px}
.cdp-bolha.eu{margin-left:auto;background:#6B46C1;color:#fff;border-radius:14px 14px 4px 14px}
.cdp-bolha-rodape{font-size:11px;opacity:.7;text-align:right;margin-top:3px}
.cdp-midia{max-width:280px;max-height:240px;border-radius:10px;display:block}
.cdp-doc{color:inherit;text-decoration:none;display:block;font-weight:700}
.cdp-compor{padding:10px 20px 14px;border-top:1px solid var(--cdp-linha);flex:none}
.cdp-texto{resize:none;min-height:42px;max-height:120px}
.cdp-icone{background:var(--cdp-linha);border:0;border-radius:10px;width:40px;height:40px;font-size:18px;cursor:pointer;flex:none;color:var(--cdp-txt)}
.cdp-mic{background:#6B46C1}
.cdp-menu{position:absolute;bottom:46px;left:0;background:var(--cdp-card);border:1px solid var(--cdp-borda);border-radius:12px;box-shadow:0 10px 30px #0003;z-index:5;min-width:230px;overflow:hidden}
.cdp-menu button{display:block;width:100%;text-align:left;background:none;border:0;padding:10px 14px;font:inherit;color:var(--cdp-txt);cursor:pointer}.cdp-menu button:hover{background:var(--cdp-sel)}
.cdp-gravando{background:#EA534A18;border-radius:12px;padding:8px 12px}
.cdp-rec{display:inline-block;width:10px;height:10px;border-radius:50%;background:#EA534A;margin-right:6px;animation:cdpPisca 1s infinite}
@keyframes cdpPisca{50%{opacity:.2}}
.cdp-erro{background:#EA534A18;color:#EA534A;border-radius:10px;padding:7px 10px;margin-bottom:8px;font-size:13px;font-weight:700}
.cdp-lado{padding:16px;overflow:auto}
.cdp-abas-mini{display:flex;gap:4px;margin-bottom:10px;border-bottom:1px solid var(--cdp-linha)}
.cdp-abas-mini button{background:none;border:0;border-bottom:3px solid transparent;padding:6px 8px;font:inherit;font-size:12px;font-weight:800;letter-spacing:.03em;color:var(--cdp-sub);cursor:pointer}
.cdp-abas-mini button.on{color:var(--cdp-ativo);border-bottom-color:#6B46C1}
.cdp-mapa{width:100%;border:0;border-radius:12px;display:block;background:var(--cdp-linha)}
.cdp-lt{display:flex;gap:10px;margin-bottom:10px}.cdp-lt-trilho{display:flex;flex-direction:column;align-items:center}
.cdp-lt-bola{width:12px;height:12px;border-radius:50%;margin-top:3px;flex:none}.cdp-lt-fio{flex:1;width:2px;margin-top:3px}
.cdp-lt b{font-size:13px}
.cdp-alerta{margin-top:8px;background:#FFF4E5;border:1px solid #FCD9A8;color:#9A5B00;border-radius:12px;padding:10px 12px;font-size:12.5px}
.cdp-escuro .cdp-alerta{background:#2a1f0b;border-color:#6b4a12;color:#f5c26b}
.cdp-alerta.atraso{background:#EA534A18;border-color:#EA534A66;color:#EA534A}
.cdp-tramite{border:1px solid var(--cdp-borda);border-radius:12px;padding:10px 12px;margin-bottom:8px}
.cdp-nota{margin-top:6px;font-style:italic;color:var(--cdp-sub)}
.cdp-hist{padding:7px 0;border-bottom:1px solid var(--cdp-linha);font-size:13px}
.cdp-modal{position:fixed;inset:0;background:#0009;display:grid;place-items:center;z-index:2000;padding:16px}
.cdp-modal-caixa{width:620px;max-width:100%;max-height:92vh;display:flex;flex-direction:column;padding:18px;color:var(--cdp-txt)}
.cdp-modal-lista{overflow:auto;flex:1;min-height:120px}
.cdp-destino{display:flex;gap:10px;align-items:center;border:1px solid var(--cdp-borda);border-radius:10px;padding:9px 11px;margin-bottom:6px;cursor:pointer}
.cdp-destino.on{border-color:#6B46C1;background:var(--cdp-sel)}.cdp-destino.ja{opacity:.55;cursor:default}
/* itens flexíveis não crescem com o conteúdo de uma linha só (texto cortado, atalhos com rolagem) */
.cdp-fila>*,.cdp-rolagem,.cdp-cartao,.cdp-centro>*,.cdp-painel,.cdp-conversa,.cdp-compor,.cdp-msgs,.cdp-relato,.cdp-cab>div{min-width:0}
.cdp-corta{display:block}
/* TELA MÉDIA: fila + atendimento; o lado direito abre na gaveta; ações abaixo do título */
.cdp-m-medio .cdp-cab{flex-direction:column;align-items:stretch!important}.cdp-m-medio .cdp-cab .cdp-acoes{justify-content:flex-start}
.cdp-m-medio .cdp-corpo{grid-template-columns:320px minmax(0,1fr)}
.cdp-gaveta{width:380px;max-width:92vw;height:100%;border-radius:16px 0 0 16px;padding:16px;overflow:auto}
/* CELULAR: fila OU atendimento em tela cheia; indicadores rolam para o lado; mensagem fixa no rodapé */
.cdp-m-celular{padding:8px;border-radius:12px;max-width:100%;overflow-x:hidden}
.cdp-m-celular .cdp-centro.detalhe>*{max-width:100%}
.cdp-m-celular .cdp-kpis{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.cdp-m-celular .cdp-kpi{padding:10px 12px;min-width:0}.cdp-m-celular .cdp-kpi-v{font-size:22px}
.cdp-m-celular .cdp-corpo{display:block;height:auto;min-height:0}
.cdp-m-celular .cdp-fila{min-height:0}.cdp-m-celular .cdp-rolagem{overflow:visible}
.cdp-m-celular .cdp-centro.escondido{display:none}
.cdp-m-celular .cdp-centro.detalhe{position:fixed;inset:0;z-index:1500;background:var(--cdp-solido);padding:8px;gap:8px;height:100dvh}
.cdp-m-celular .cdp-h1{font-size:16px}
.cdp-m-celular .cdp-etapas{margin-top:8px}.cdp-m-celular .cdp-etapa b{display:none}
.cdp-m-celular .cdp-bola{width:20px;height:20px;font-size:11px}
.cdp-m-celular .cdp-abas{overflow-x:auto;padding:0 6px}.cdp-m-celular .cdp-abas button{padding:10px 9px;white-space:nowrap;font-size:13px}
.cdp-m-celular .cdp-msgs{padding:10px 12px}.cdp-m-celular .cdp-bolha{max-width:86%}
.cdp-m-celular .cdp-compor{padding:8px 10px 10px}.cdp-m-celular .cdp-compor .cdp-chips{flex-wrap:nowrap;overflow-x:auto}
.cdp-m-celular .cdp-compor .cdp-chip{white-space:nowrap}
.cdp-m-celular .cdp-relato{max-height:none;border-bottom:0}
.cdp-m-celular .cdp-modal-caixa{max-height:96dvh}
`;
