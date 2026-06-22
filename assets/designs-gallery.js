(function(){

  var AH=(function(){
    var STAGE={lead:'Lead',planning:'Planning',proposal:'Proposal',design:'Design',development:'Development',qa:'QA / staging',launch:'Launch',maintenance:'Maintenance'};
    var STAGE_ICON={lead:'ti-flag',planning:'ti-clipboard-list',proposal:'ti-file-description',design:'ti-palette',development:'ti-code',qa:'ti-flask',launch:'ti-rocket',maintenance:'ti-tool'};
    var HMAP={on_track:{label:'On track',color:'#6ee7b7',bg:'rgba(52,211,153,.12)',border:'rgba(52,211,153,.30)',dot:'#34d399'},
              at_risk:{label:'At risk',color:'#fcd34d',bg:'rgba(251,191,36,.13)',border:'rgba(251,191,36,.32)',dot:'#fbbf24'},
              blocked:{label:'Blocked',color:'#fca5a5',bg:'rgba(248,113,113,.14)',border:'rgba(248,113,113,.34)',dot:'#f87171'}};
    var LINKDEF=[['figma','ti-brand-figma','Figma'],['repo','ti-brand-github','Repo'],['dev','ti-code','Dev'],['staging','ti-flask','Staging'],['live','ti-world','Live'],['docs','ti-file-text','Docs']];
    function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
    function present(v){return v!=null&&v!=='';}
    function initials(n){var w=String(n||'?').split(/[\s–—-]+/).filter(Boolean);return ((w[0]?w[0][0]:'?')+(w[1]?w[1][0]:'')).toUpperCase();}
    function health(h){return HMAP[h]||HMAP.on_track;}
    function links(p){var L=(p&&p.links)||{};var dep=(p&&p.deploy)||{};var out=[];LINKDEF.forEach(function(d){var u=d[0]==='live'?(L.live||dep.url||''):(L[d[0]]||'');if(present(u))out.push({key:d[0],icon:d[1],label:d[2],url:u});});return out;}
    function ab(d){return d.toLocaleDateString('en',{month:'short',day:'numeric'});}
    function relTime(iso){if(!iso)return '';var d=new Date(iso);if(isNaN(d))return '';var days=Math.round((Date.now()-d.getTime())/864e5);if(days<0)return ab(d);if(days<1)return 'today';if(days<2)return 'yesterday';if(days<30)return days+' days ago';return ab(d);}
    function updated(p){p=p||{};return relTime((p.deploy&&p.deploy.lastDeployed)||(p.repoInfo&&p.repoInfo.lastCommitDate)||'');}
    function openPRs(p){return (p&&p.repoInfo&&p.repoInfo.openPRs)||0;}
    function language(p){return (p&&p.repoInfo&&p.repoInfo.language)||'';}
    return {esc:esc,present:present,initials:initials,STAGE:STAGE,STAGE_ICON:STAGE_ICON,health:health,links:links,updated:updated,openPRs:openPRs,language:language};
  })();
  var NAMES={"d1": "Cover banner", "d2": "Progress ring focal", "d3": "Compact list-row", "d4": "Glass spotlight", "d5": "Lifecycle track", "d6": "Resource tiles", "d7": "Editorial type", "d8": "Data widget", "d9": "Primary CTA app-card", "d10": "Split panel"};var ORDER=["d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8", "d9", "d10"];
  var R={
  "d1": function(p){
  var h = AH.health(p.health);
  var stageKey = p.stage;
  var stageLabel = AH.STAGE[stageKey] || (stageKey ? String(stageKey) : "");
  var stageIcon = AH.STAGE_ICON[stageKey] || "ti-flag";
  var prog = (p.progress != null ? p.progress : 0);

  var links = AH.links(p).map(function(l){
    var cls = "link" + (l.key === "live" ? " live" : "");
    return '<a class="' + cls + '" href="' + AH.esc(l.url) + '" target="_blank" rel="noopener"><i class="ti ' + AH.esc(l.icon) + '"></i>' + AH.esc(l.label) + '</a>';
  }).join("");

  var metaParts = [];
  if (AH.present(p.client)) metaParts.push(AH.esc(p.client));
  if (AH.present(p.type)) metaParts.push(AH.esc(p.type));
  var meta = metaParts.length ? '<div class="meta">' + metaParts.join(" · ") + '</div>' : '';

  var cover = AH.present(p.coverGradient) ? p.coverGradient : "linear-gradient(135deg, #6d5efc, #22d3ee)";

  var stageHtml = stageLabel ? '<span class="g-stage"><i class="ti ' + AH.esc(stageIcon) + '"></i>' + AH.esc(stageLabel) + '</span>' : '';

  var lang = AH.language(p);
  var prs = AH.openPRs(p);
  var footParts = [];
  if (AH.present(lang)) footParts.push('<span>' + AH.esc(lang) + '</span>');
  if (prs > 0) footParts.push('<span>' + prs + ' open PR' + (prs === 1 ? '' : 's') + '</span>');
  var footExtra = footParts.join(' · ');

  return '' +
  '<div class="card">' +
    '<div class="cover" style="background:' + AH.esc(cover) + '">' +
      '<div class="mono">' + AH.esc(AH.initials(p.name)) + '</div>' +
      '<div class="title-wrap">' +
        '<div class="name">' + AH.esc(p.name) + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="body">' +
      meta +
      (links ? '<div class="links">' + links + '</div>' : '') +
      '<div class="status">' +
        '<span class="health" style="color:' + h.color + ';background:' + h.bg + ';">' +
          '<span class="dot" style="background:' + h.dot + ';box-shadow:0 0 6px ' + h.dot + ';"></span>' + AH.esc(h.label) +
        '</span>' +
        stageHtml +
      '</div>' +
      '<div class="progress">' +
        '<div class="progress-head"><span>Progress</span><b>' + prog + '%</b></div>' +
        '<div class="g-bar"><span style="width:' + prog + '%"></span></div>' +
      '</div>' +
      '<div class="g-foot">' +
        '<i class="ti ti-clock"></i>' +
        '<span>' + AH.esc(AH.updated(p)) + '</span>' +
        (footExtra ? '<span class="ml">' + footExtra + '</span>' : '') +
      '</div>' +
    '</div>' +
  '</div>';
},
  "d2": function(p){
  var esc = AH.esc;
  var progress = Math.max(0, Math.min(100, Number(p.progress) || 0));
  var circ = 402.1;
  var offset = (circ * (1 - progress / 100)).toFixed(1);

  var h = AH.health(p.health);

  // identity sub line: client · type
  var subParts = [];
  if (AH.present(p.client)) subParts.push(esc(p.client));
  if (AH.present(p.type)) subParts.push(esc(p.type));
  var subHtml = subParts.length ? '<div class="d2-sub">' + subParts.join(' · ') + '</div>' : '';

  // cover gradient applied to monogram tile
  var monoStyle = AH.present(p.coverGradient) ? ' style="background:' + esc(p.coverGradient) + '"' : '';

  // stage chip
  var stageKey = p.stage || '';
  var stageLabel = AH.STAGE[stageKey] || (stageKey ? esc(stageKey) : '');
  var stageIcon = AH.STAGE_ICON[stageKey] || 'ti-flag';
  var stageHtml = stageLabel
    ? '<span class="d2-chip d2-stage"><i class="ti ' + esc(stageIcon) + '"></i>' + esc(stageLabel) + '</span>'
    : '';

  // health chip with dynamic inline colors
  var healthHtml =
    '<span class="d2-chip d2-health" style="color:' + h.color + ';background:' + h.bg + ';border-color:' + h.border + '">' +
      '<span class="d2-dot" style="background:' + h.dot + ';box-shadow:0 0 7px ' + h.dot + '"></span>' +
      esc(h.label) +
    '</span>';

  // links (only present ones, live gets lime accent)
  var links = AH.links(p) || [];
  var linksHtml = '';
  if (links.length) {
    linksHtml = '<div class="d2-links">' + links.map(function(l){
      var live = l.key === 'live' ? ' d2-live' : '';
      return '<a class="d2-link' + live + '" href="' + esc(l.url) + '" target="_blank" rel="noopener">' +
        '<i class="ti ' + esc(l.icon) + '"></i>' + esc(l.label) + '</a>';
    }).join('') + '</div>';
  }

  // footer: updated + optional PRs
  var prs = AH.openPRs(p);
  var prHtml = prs > 0
    ? '<span class="d2-pr"><i class="ti ti-git-pull-request"></i>' + prs + ' PR' + (prs === 1 ? '' : 's') + '</span>'
    : '';
  var footHtml =
    '<div class="d2-foot">' +
      '<i class="ti ti-clock"></i>Updated ' + esc(AH.updated(p)) +
      prHtml +
    '</div>';

  return '' +
    '<div class="d2-ringwrap">' +
      '<svg class="d2-ring" viewBox="0 0 148 148" aria-hidden="true">' +
        '<defs>' +
          '<linearGradient id="d2grad" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop offset="0%" stop-color="#6d5efc"/>' +
            '<stop offset="100%" stop-color="#22d3ee"/>' +
          '</linearGradient>' +
        '</defs>' +
        '<circle class="d2-ring-track" cx="74" cy="74" r="64"/>' +
        '<circle class="d2-ring-arc" cx="74" cy="74" r="64" style="stroke-dashoffset:' + offset + '"/>' +
      '</svg>' +
      '<div class="d2-ring-center">' +
        '<div class="d2-pct">' + progress + '<span>%</span></div>' +
        '<div class="d2-pct-lbl">Progress</div>' +
      '</div>' +
    '</div>' +

    '<div class="d2-id">' +
      '<div class="d2-mono"' + monoStyle + '>' + esc(AH.initials(p.name)) + '</div>' +
      '<div class="d2-id-txt">' +
        '<div class="d2-name">' + esc(p.name || '') + '</div>' +
        subHtml +
      '</div>' +
    '</div>' +

    '<div class="d2-chips">' + healthHtml + stageHtml + '</div>' +

    linksHtml +

    footHtml;
},
  "d3": function(p){
  var h = AH.health(p.health);
  var grad = AH.present(p.coverGradient) ? p.coverGradient : 'linear-gradient(135deg,#6d5efc,#22d3ee)';
  var stageKey = p.stage || '';
  var stageLabel = AH.STAGE[stageKey] || stageKey || '';
  var stageIcon = AH.STAGE_ICON[stageKey] || 'ti-flag';
  var prog = (p.progress != null ? p.progress : 0);

  var subParts = [];
  if (AH.present(p.client)) subParts.push(AH.esc(p.client));
  if (AH.present(p.type)) subParts.push(AH.esc(p.type));
  var sub = subParts.join(' &middot; ');

  var linksHtml = AH.links(p).map(function(l){
    var live = l.key === 'live' ? ' live' : '';
    return '<a class="lnk' + live + '" href="' + AH.esc(l.url) + '" title="' + AH.esc(l.label) + '" aria-label="' + AH.esc(l.label) + '"><i class="ti ' + AH.esc(l.icon) + '"></i></a>';
  }).join('');

  var stageHtml = stageLabel ? '<span class="g-stage"><i class="ti ' + AH.esc(stageIcon) + '"></i>' + AH.esc(stageLabel) + '</span>' : '';

  return '<div class="row">'
    + '<div class="mono" style="background:' + AH.esc(grad) + '">' + AH.esc(AH.initials(p.name)) + '</div>'
    + '<div class="mid">'
      + '<div class="name">' + AH.esc(p.name || '') + '</div>'
      + (sub ? '<div class="g-sub">' + sub + '</div>' : '')
      + '<div class="meta">'
        + '<span class="health" style="background:' + h.bg + ';color:' + h.color + '"><span class="dot" style="background:' + h.dot + ';box-shadow:0 0 7px 1px ' + h.dot + '"></span>' + AH.esc(h.label) + '</span>'
        + stageHtml
      + '</div>'
    + '</div>'
    + (linksHtml ? '<div class="links">' + linksHtml + '</div>' : '')
    + '<div class="g-foot">'
      + '<span class="g-pct">' + prog + '%</span>'
      + '<span class="g-bar"><i style="width:' + prog + '%"></i></span>'
      + '<span class="upd">' + AH.esc(AH.updated(p)) + '</span>'
    + '</div>'
  + '</div>';
},
  "d4": function(p){
  var h = AH.health(p.health);
  var stageKey = p.stage || "";
  var stageLabel = AH.STAGE[stageKey] || (stageKey ? stageKey : "");
  var stageIcon = AH.STAGE_ICON[stageKey] || "ti-circle";
  var prog = (typeof p.progress === "number") ? p.progress : 0;
  if(prog < 0) prog = 0; if(prog > 100) prog = 100;

  var meta = "";
  if(AH.present(p.client) && AH.present(p.type)) meta = AH.esc(p.client) + " · " + AH.esc(p.type);
  else if(AH.present(p.client)) meta = AH.esc(p.client);
  else if(AH.present(p.type)) meta = AH.esc(p.type);

  var links = AH.links(p);
  var linksHtml = "";
  for(var i=0;i<links.length;i++){
    var l = links[i];
    var cls = "lnk" + (l.key === "live" ? " live" : "");
    linksHtml += '<a class="'+cls+'" href="'+AH.esc(l.url)+'"><i class="ti '+AH.esc(l.icon)+'"></i>'+AH.esc(l.label)+'</a>';
  }
  var linksBlock = links.length ? '<div class="links">'+linksHtml+'</div>' : '';

  var grad = AH.present(p.coverGradient) ? p.coverGradient : "linear-gradient(135deg,#6d5efc,#22d3ee)";

  var html =
  '<div class="card">'+
    '<div class="g-glow"></div>'+
    '<div class="mono" style="background:'+AH.esc(grad)+'">'+AH.esc(AH.initials(p.name))+'</div>'+
    '<div class="name">'+AH.esc(p.name)+'</div>'+
    (meta ? '<div class="meta">'+meta+'</div>' : '')+
    '<div class="health" style="color:'+h.color+';background:'+h.bg+';border:1px solid '+h.border+'"><span class="dot" style="background:'+h.dot+';box-shadow:0 0 8px '+h.dot+'"></span>'+AH.esc(h.label)+'</div>'+
    '<div class="d4stat">'+
      '<div class="blk">'+
        '<span class="lbl">Stage</span>'+
        '<span class="val"><i class="ti '+AH.esc(stageIcon)+'"></i>'+AH.esc(stageLabel)+'</span>'+
      '</div>'+
      '<div class="sep"></div>'+
      '<div class="blk">'+
        '<span class="lbl">Progress</span>'+
        '<span class="val g-pct">'+prog+'%</span>'+
      '</div>'+
    '</div>'+
    '<div class="g-bar"><span style="width:'+prog+'%"></span></div>'+
    linksBlock+
    '<div class="g-foot"><i class="ti ti-clock"></i>Updated '+AH.esc(AH.updated(p))+'</div>'+
  '</div>';
  return html;
},
  "d5": function(p){
  var esc=AH.esc, present=AH.present;
  var grad = present(p.coverGradient) ? p.coverGradient : "linear-gradient(135deg,#6d5efc,#22d3ee)";

  // health (dynamic)
  var h = AH.health(p.health) || {};
  var healthStyle = "color:"+(h.color||"#a3a3ae")+";background:"+(h.bg||"rgba(255,255,255,.06)")+";border:1px solid "+(h.border||"rgba(255,255,255,.18)")+";";
  var dotStyle = "background:"+(h.dot||h.color||"#a3a3ae")+";box-shadow:0 0 7px "+(h.dot||h.color||"rgba(255,255,255,.5)")+";";
  var healthLabel = h.label || "";

  // lifecycle nodes -> map stage key to node index
  var nodes = [
    {key:"lead",        lbl:"Lead"},
    {key:"planning",    lbl:"Plan"},
    {key:"design",      lbl:"Design"},
    {key:"development", lbl:"Develop"},
    {key:"qa",          lbl:"QA"},
    {key:"launch",      lbl:"Launch"},
    {key:"maintenance", lbl:"Maint"}
  ];
  var stageKey = present(p.stage) ? String(p.stage) : "development";
  var nowIdx = -1;
  for(var i=0;i<nodes.length;i++){ if(nodes[i].key===stageKey){ nowIdx=i; break; } }
  if(nowIdx<0) nowIdx=3; // sensible default = Development

  // build ticks
  var ticks="";
  for(var j=0;j<nodes.length;j++){
    var cls = j<nowIdx ? " done" : (j===nowIdx ? " now" : "");
    ticks += '<div class="tick'+cls+'"><i></i><span class="t-lbl">'+esc(nodes[j].lbl)+'</span></div>';
  }
  // fill width: from first node (left:7px) to centered on the current node.
  // ticks are evenly distributed across the rail; node centers sit at j/(n-1) of the inner span.
  var n = nodes.length;
  var fillPct = (n>1) ? (nowIdx/(n-1))*100 : 0;
  if(fillPct<6) fillPct=6;

  // progress %
  var prog = present(p.progress) ? p.progress : Math.round(fillPct);

  // stage caption
  var stageLabel = (AH.STAGE && AH.STAGE[stageKey]) ? AH.STAGE[stageKey] : stageKey;
  var stageIcon = (AH.STAGE_ICON && AH.STAGE_ICON[stageKey]) ? AH.STAGE_ICON[stageKey] : "ti-flag";

  // extra: PRs / language (only if present)
  var extraBits=[];
  var prs = AH.openPRs(p);
  if(present(prs) && prs>0) extraBits.push('<i class="ti ti-git-pull-request"></i>'+prs+' PR'+(prs===1?'':'s'));
  var lang = AH.language(p);
  if(present(lang)) extraBits.push(esc(lang));
  var extraHtml = extraBits.length
    ? '<span class="extra">'+extraBits.join('<span class="sep">·</span> ')+'</span>'
    : '';

  // links (only present)
  var links = AH.links(p) || [];
  var linksHtml = links.map(function(l){
    var live = l.key==="live" ? " live" : "";
    return '<a class="lnk'+live+'" href="'+esc(l.url)+'"><i class="ti '+esc(l.icon)+'"></i><span>'+esc((l.label||"").toUpperCase())+'</span></a>';
  }).join("");
  var linksBlock = links.length ? '<div class="links">'+linksHtml+'</div>' : '';

  // meta line: client · type
  var metaBits=[];
  if(present(p.client)) metaBits.push(esc(p.client));
  if(present(p.type)) metaBits.push(esc(p.type));
  var metaHtml = metaBits.join(' · ');

  var html =
  '<div class="card">'+
    '<div class="strip" style="background:'+esc(grad)+'"></div>'+
    '<div class="body">'+
      '<div class="head">'+
        '<div class="mono" style="background:'+esc(grad)+'">'+esc(AH.initials(p.name))+'</div>'+
        '<div class="id">'+
          '<div class="name">'+esc(p.name||"")+'</div>'+
          (metaHtml?'<div class="meta">'+metaHtml+'</div>':'')+
        '</div>'+
        (healthLabel?'<span class="health" style="'+healthStyle+'"><span class="dot" style="'+dotStyle+'"></span>'+esc(healthLabel)+'</span>':'')+
      '</div>'+

      '<div class="track-wrap">'+
        '<div class="track-top">'+
          '<span class="track-lbl">Lifecycle</span>'+
          '<span class="track-pct">'+esc(String(prog))+'<span>%</span></span>'+
        '</div>'+
        '<div class="rail" style="--fill:'+fillPct.toFixed(1)+'%">'+
          '<div class="ticks">'+ticks+'</div>'+
        '</div>'+
      '</div>'+

      '<div class="g-stage">'+
        '<i class="ti '+esc(stageIcon)+'"></i><span>Stage</span> <b>'+esc(stageLabel)+'</b>'+
        extraHtml+
      '</div>'+

      linksBlock+

      '<div class="g-foot">'+
        '<span class="updated"><i class="ti ti-clock"></i>Updated '+esc(AH.updated(p))+'</span>'+
      '</div>'+

    '</div>'+
  '</div>';

  return html;
},
  "d6": function(p){
  var h = AH.health(p.health);
  var mono = AH.esc(AH.initials(p.name));
  var name = AH.esc(p.name);
  var type = AH.present(p.type) ? AH.esc(p.type) : "";
  var client = AH.present(p.client) ? AH.esc(p.client) : "";
  var subParts = [];
  if (client) subParts.push(client);
  if (type) subParts.push(type);
  var sub = subParts.join(" · ");

  var stageKey = p.stage;
  var stageLabel = AH.esc(AH.STAGE[stageKey] || stageKey || "");
  var stageIcon = AH.STAGE_ICON[stageKey] || "ti-flag";

  var progress = (typeof p.progress === "number") ? p.progress : 0;
  if (progress < 0) progress = 0; if (progress > 100) progress = 100;

  var links = AH.links(p) || [];
  var tiles = links.map(function(l){
    var cls = "d6-tile" + (l.key === "live" ? " d6-live" : "");
    return '<a href="' + AH.esc(l.url) + '" class="' + cls + '">' +
      '<i class="ti ' + AH.esc(l.icon) + '"></i>' +
      '<span>' + AH.esc((l.label || "").toUpperCase()) + '</span>' +
    '</a>';
  }).join("");
  var tilesBlock = tiles ? '<div class="d6-tiles">' + tiles + '</div>' : "";

  var monoStyle = AH.present(p.coverGradient)
    ? ' style="background:' + AH.esc(p.coverGradient) + '"'
    : '';

  var healthStyle = ' style="color:' + AH.esc(h.color) + ';background:' + AH.esc(h.bg) + '"';
  var dotStyle = ' style="background:' + AH.esc(h.dot) + '"';

  var stageBlock = stageLabel
    ? '<div class="d6-stagebar">' +
        '<i class="ti ' + AH.esc(stageIcon) + '"></i>' +
        '<span>' + stageLabel + '</span>' +
        '<span class="d6-line"></span>' +
      '</div>'
    : '';

  var html =
    '<div class="d6-head">' +
      '<div class="d6-mono"' + monoStyle + '>' + mono + '</div>' +
      '<div class="d6-id">' +
        '<div class="d6-name">' + name + '</div>' +
        (sub ? '<div class="d6-sub">' + sub + '</div>' : '') +
      '</div>' +
      '<div class="d6-health"' + healthStyle + '>' +
        '<span class="d6-dot"' + dotStyle + '></span>' + AH.esc(h.label) +
      '</div>' +
    '</div>' +
    stageBlock +
    tilesBlock +
    '<div class="d6-foot">' +
      '<div class="d6-prog">' +
        '<div class="d6-track"><div class="d6-fill" style="width:' + progress + '%"></div></div>' +
        '<div class="d6-pct">' + progress + '%</div>' +
      '</div>' +
      '<div class="d6-updated">' +
        '<i class="ti ti-clock"></i><span>Updated ' + AH.esc(AH.updated(p)) + '</span>' +
      '</div>' +
    '</div>';

  return html;
},
  "d7": function(p){
  var h = AH.health(p.health);
  var top = AH.esc(p.client || "");
  if (AH.present(p.type)) top = top ? top + " · " + AH.esc(p.type) : AH.esc(p.type);
  var prog = (p.progress != null ? p.progress : 0);

  var links = AH.links(p);
  var linksHtml = "";
  if (links.length) {
    linksHtml = '<div class="d7-links">' + links.map(function(l){
      var live = l.key === "live" ? " d7-live" : "";
      return '<a href="' + AH.esc(l.url) + '" class="d7-link' + live + '">'
        + '<i class="ti ' + AH.esc(l.icon) + '"></i>' + AH.esc(l.label) + '</a>';
    }).join("") + '</div>';
  }

  return ''
    + '<div class="d7-top">'
    +   '<span class="d7-mono">' + top + '</span>'
    +   '<div class="d7-monogram">' + AH.esc(AH.initials(p.name)) + '</div>'
    + '</div>'
    + '<h2 class="d7-name">' + AH.esc(p.name) + '</h2>'
    + '<div class="d7-meta">'
    +   '<span class="d7-health" style="color:' + h.color + '">'
    +     '<span class="d7-dot" style="background:' + h.dot + ';box-shadow:0 0 0 4px ' + h.bg + '"></span>'
    +     AH.esc(h.label) + '</span>'
    +   '<span class="d7-sep"></span>'
    +   '<span class="d7-stage"><i class="ti ' + AH.esc(AH.STAGE_ICON[p.stage] || "ti-point") + '"></i>'
    +     AH.esc(AH.STAGE[p.stage] || p.stage || "") + '</span>'
    + '</div>'
    + '<div class="d7-prog-head">'
    +   '<span class="d7-prog-label">Progress</span>'
    +   '<span class="d7-prog-num">' + prog + '<span>%</span></span>'
    + '</div>'
    + '<div class="d7-track"><div class="d7-fill" style="width:' + prog + '%"></div></div>'
    + linksHtml
    + '<div class="d7-foot">'
    +   '<span class="d7-updated"><i class="ti ti-clock"></i>' + AH.esc(AH.updated(p)) + '</span>'
    + '</div>';
},
  "d8": function(p){
  var h = AH.health(p.health);
  var sub = [AH.esc(p.client||''), AH.esc(p.type||'')].filter(function(x){return x;}).join(' · ');
  var rows = '';
  rows += '<div class="row"><span class="k"><i class="ti ti-activity-heartbeat"></i>Health</span>'
    + '<span class="g-pill" style="color:'+h.color+';background:'+h.bg+';border:1px solid '+h.border+';">'
    + '<span class="dot" style="background:'+h.dot+';box-shadow:0 0 6px '+h.dot+';"></span>'+AH.esc(h.label)+'</span></div>';
  rows += '<div class="row"><span class="k"><i class="ti '+(AH.STAGE_ICON[p.stage]||'ti-flag')+'"></i>Stage</span>'
    + '<span class="v">'+AH.esc(AH.STAGE[p.stage]||p.stage||'')+'</span></div>';
  if (AH.present(AH.openPRs(p)) && AH.openPRs(p) !== null){
    rows += '<div class="row"><span class="k"><i class="ti ti-git-pull-request"></i>Open PRs</span>'
      + '<span class="v">'+AH.openPRs(p)+'</span></div>';
  }
  var lang = AH.language(p);
  if (AH.present(lang)){
    rows += '<div class="row"><span class="k"><i class="ti ti-code"></i>Language</span>'
      + '<span class="v dim">'+AH.esc(lang)+'</span></div>';
  }
  rows += '<div class="row"><span class="k"><i class="ti ti-clock"></i>Updated</span>'
    + '<span class="v dim">'+AH.esc(AH.updated(p))+'</span></div>';

  var prog = (p.progress!=null) ? p.progress : 0;
  var links = AH.links(p).map(function(l){
    var live = l.key === 'live' ? ' live' : '';
    return '<a class="lnk'+live+'" href="'+AH.esc(l.url)+'"><i class="ti '+l.icon+'"></i>'+AH.esc(l.label)+'</a>';
  }).join('');

  return '<div class="card">'
    + '<div class="hd">'
      + '<div class="mono" style="background:'+AH.esc(p.coverGradient||'linear-gradient(135deg,#6d5efc,#22d3ee)')+';">'+AH.esc(AH.initials(p.name))+'</div>'
      + '<div class="hd-txt">'
        + '<div class="nm">'+AH.esc(p.name||'')+'</div>'
        + (sub ? '<div class="g-sub">'+sub+'</div>' : '')
      + '</div>'
    + '</div>'
    + '<div class="g-rows">'+rows+'</div>'
    + '<div class="prow">'
      + '<div class="ptop"><span class="plbl">Progress</span>'
      + '<span class="pnum">'+prog+'<span>%</span></span></div>'
      + '<div class="track"><div class="fill" style="width:'+prog+'%;"></div></div>'
    + '</div>'
    + (links ? '<div class="links">'+links+'</div>' : '')
  + '</div>';
},
  "d9": function(p){
  var h = AH.health(p.health);
  var sub = [AH.esc(p.client||''), AH.esc(p.type||'')].filter(Boolean).join(' · ');
  var stageKey = p.stage||'';
  var stageLabel = AH.STAGE[stageKey]||stageKey;
  var stageIcon = AH.STAGE_ICON[stageKey]||'ti-flag';
  var prog = (p.progress!=null?p.progress:0);

  // links: live becomes the primary CTA; the rest go in the segmented nav
  var all = AH.links(p);
  var live = null, rest = [];
  all.forEach(function(l){ if(l.key==='live'){ live = l; } else { rest.push(l); } });

  var html = '<div class="card">';
  html += '<div class="top"><span class="eyebrow">Project</span>'
        + '<span class="updated"><i class="ti ti-clock"></i>'+AH.esc(AH.updated(p))+'</span></div>';

  html += '<div class="mono" style="background:'+AH.esc(p.coverGradient||'linear-gradient(135deg,#6d5efc,#22d3ee)')+'">'
        + AH.esc(AH.initials(p.name))+'</div>';
  html += '<div class="name">'+AH.esc(p.name||'')+'</div>';
  if(sub){ html += '<div class="g-sub">'+sub+'</div>'; }

  html += '<div class="chips">';
  html += '<span class="g-chip health" style="color:'+h.color+';background:'+h.bg+';border-color:'+h.border+'">'
        + '<span class="dot" style="background:'+h.dot+';box-shadow:0 0 7px '+h.dot+'"></span>'+AH.esc(h.label)+'</span>';
  if(stageKey){ html += '<span class="g-chip g-stage"><i class="ti '+AH.esc(stageIcon)+'"></i>'+AH.esc(stageLabel)+'</span>'; }
  html += '</div>';

  html += '<div class="prog"><div class="prog-head">'
        + '<span class="prog-label">Progress</span>'
        + '<span class="prog-val">'+prog+'<span>%</span></span></div>'
        + '<div class="track"><div class="fill" style="width:'+prog+'%"></div></div></div>';

  if(live){
    html += '<a href="'+AH.esc(live.url)+'" class="g-cta"><i class="ti '+AH.esc(live.icon)+'"></i>Open '+AH.esc(live.label)+'</a>';
  }

  if(rest.length){
    html += '<nav class="seg" style="grid-template-columns:repeat('+rest.length+',1fr)">';
    rest.forEach(function(l){
      html += '<a href="'+AH.esc(l.url)+'"><i class="ti '+AH.esc(l.icon)+'"></i>'+AH.esc(l.label)+'</a>';
    });
    html += '</nav>';
  }

  var metaParts = [];
  var prs = AH.openPRs(p);
  if(AH.present(p.repoInfo&&p.repoInfo.openPRs)){
    metaParts.push('<span><i class="ti ti-git-pull-request"></i>'+prs+' PRs</span>');
  }
  var lang = AH.language(p);
  if(AH.present(lang)){
    metaParts.push('<span><i class="ti ti-code"></i>'+AH.esc(lang)+'</span>');
  }
  if(metaParts.length){
    html += '<div class="meta">'+metaParts.join('<span class="sep"></span>')+'</div>';
  }

  html += '</div>';
  return html;
},
  "d10": function(p){
  var h = AH.health(p.health);
  var stageKey = p.stage || "";
  var stageLabel = AH.STAGE[stageKey] || stageKey || "";
  var stageIcon = AH.STAGE_ICON[stageKey] || "ti-flag";
  var prog = (p.progress != null ? p.progress : 0);

  var sub = "";
  if (AH.present(p.client) && AH.present(p.type)) sub = AH.esc(p.client) + " · " + AH.esc(p.type);
  else if (AH.present(p.client)) sub = AH.esc(p.client);
  else if (AH.present(p.type)) sub = AH.esc(p.type);

  var linkArr = AH.links(p);
  var linksHtml = linkArr.map(function(l){
    var cls = (l.key === "live") ? "lnk live" : "lnk";
    return '<a class="' + cls + '" href="' + AH.esc(l.url) + '"><i class="ti ' + AH.esc(l.icon) + '"></i>' + AH.esc(l.label) + '</a>';
  }).join("");

  var foot = '<i class="ti ti-clock"></i>Updated ' + AH.esc(AH.updated(p));
  var prs = AH.openPRs(p);
  if (AH.present(p.repoInfo && p.repoInfo.openPRs)) {
    foot += '<span class="g-pr"><i class="ti ti-git-pull-request"></i>' + prs + ' PRs</span>';
  }

  return '<div class="card">' +
      '<div class="top">' +
        '<div class="id-row">' +
          '<div class="mono">' + AH.esc(AH.initials(p.name)) + '</div>' +
          '<div class="id-txt">' +
            '<div class="name">' + AH.esc(p.name) + '</div>' +
            (sub ? '<div class="g-sub">' + sub + '</div>' : '') +
          '</div>' +
        '</div>' +
        '<span class="health" style="color:' + h.color + ';background:' + h.bg + ';">' +
          '<span class="dot" style="background:' + h.dot + ';box-shadow:0 0 0 3px ' + h.border + ';"></span>' + AH.esc(h.label) +
        '</span>' +
      '</div>' +
      '<div class="split"></div>' +
      '<div class="bot">' +
        (linksHtml ? '<div class="links">' + linksHtml + '</div>' : '') +
        '<div class="prog-head">' +
          '<span class="g-stage"><i class="ti ' + AH.esc(stageIcon) + '"></i>' + AH.esc(stageLabel) + '</span>' +
          '<span class="g-pct">' + prog + '%</span>' +
        '</div>' +
        '<div class="g-bar"><span style="width:' + prog + '%;"></span></div>' +
        '<div class="g-foot">' + foot + '</div>' +
      '</div>' +
    '</div>';
}
  };

  function build(){
    var root=document.getElementById('design-gallery'); if(!root||root.dataset.built) return; root.dataset.built='1';
    fetch('/data/projects.json',{cache:'no-store'}).then(function(r){return r.json();}).then(function(data){
      var ps=(data.projects||[]).filter(function(p){return !p.hidden;});
      ORDER.forEach(function(pre,i){
        var sec=document.createElement('section');sec.className='cmp';
        var cards='';
        ps.forEach(function(p){try{cards+='<div class="'+pre+'">'+R[pre](p)+'</div>';}catch(e){}});
        sec.innerHTML='<div class="hd"><b>D'+(i+1)+'</b><h2>'+NAMES[pre]+'</h2></div><div class="deck">'+cards+'</div>';
        root.appendChild(sec);
      });
    }).catch(function(){});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();

})();