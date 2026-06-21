/* Artist Hub — render project cards from /data/projects.json into any [data-projects-grid].
   Shared by index.html (landing preview) and dashboard.html. No build step.
   Smart, centered card: monogram avatar + soft color glow + centered content. */
(function () {
  var STAGE = { lead: "Lead", planning: "Planning", proposal: "Proposal", design: "Design", development: "Development", qa: "QA / staging", launch: "Launch", maintenance: "Maintenance" };
  var HEALTH = { on_track: ["#34d399", "On track"], at_risk: ["#fbbf24", "At risk"], blocked: ["#f87171", "Blocked"] };
  var LINKS = [["figma", "ti-brand-figma", "Figma"], ["repo", "ti-brand-github", "Repository"], ["dev", "ti-code", "Dev"], ["staging", "ti-flask", "Staging"], ["live", "ti-world", "Live site"], ["docs", "ti-file-text", "Docs"]];

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fmt(iso) { if (!iso) return ""; try { return new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric" }); } catch (e) { return ""; } }
  function initials(name) {
    var w = String(name || "?").split(/[\s–—\-]+/).filter(Boolean);
    return ((w[0] ? w[0][0] : "?") + (w[1] ? w[1][0] : "")).toUpperCase();
  }

  function card(p, i) {
    var h = HEALTH[p.health] || HEALTH.on_track;
    var grad = esc(p.coverGradient || "linear-gradient(135deg,#6d5efc,#8b7cff)");
    var links = LINKS.filter(function (l) { return p.links && p.links[l[0]]; }).map(function (l) {
      return '<a class="picon" href="' + esc(p.links[l[0]]) + '" target="_blank" rel="noopener" aria-label="' + esc(p.name) + " — " + l[2] + '"><i class="ti ' + l[1] + '" aria-hidden="true"></i></a>';
    }).join("");
    var date = fmt(p.deploy && p.deploy.lastDeployed) || fmt(p.repoInfo && p.repoInfo.lastCommitDate);
    return '' +
      '<div class="pc" style="animation-delay:' + (i * 55) + 'ms">' +
        '<div class="pglow" aria-hidden="true" style="background:' + grad + '"></div>' +
        '<div class="pb">' +
          '<div class="pav" style="background:' + grad + '">' + esc(initials(p.name)) + "</div>" +
          '<div class="pn">' + esc(p.name) + "</div>" +
          '<div class="pcl">' + esc(p.client) + (p.type ? " · " + esc(p.type) : "") + "</div>" +
          '<div class="pchips"><span class="sp"><span class="d" style="background:' + h[0] + '"></span>' + esc(STAGE[p.stage] || p.stage) + "</span></div>" +
          '<div class="barwrap"><span class="bar"><i style="width:' + (p.progress || 0) + '%"></i></span><span class="pct">' + (p.progress == null ? "" : p.progress + "%") + "</span></div>" +
          (links ? '<div class="pl">' + links + "</div>" : "") +
          (date ? '<div class="pfoot">updated ' + date + "</div>" : "") +
        "</div>" +
      "</div>";
  }

  function injectStyle() {
    if (document.getElementById("ah-proj-style")) return;
    var s = document.createElement("style");
    s.id = "ah-proj-style";
    s.textContent =
      "[data-projects-grid]{display:flex!important;flex-wrap:wrap;justify-content:center;gap:14px}" +
      "[data-projects-grid] .pc{position:relative;flex:0 0 236px;max-width:236px;border-radius:18px;overflow:hidden;text-align:center;cursor:default;animation:ah-cardin .55s cubic-bezier(.34,1.56,.64,1) both}" +
      "[data-projects-grid] .pc .pglow{position:absolute;top:-12px;left:0;right:0;height:100px;opacity:.20;filter:blur(26px);pointer-events:none}" +
      "[data-projects-grid] .pc .pb{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;padding:22px 18px 18px}" +
      "[data-projects-grid] .pc .pav{width:48px;height:48px;border-radius:15px;display:grid;place-items:center;font:600 15px 'Inter',system-ui,sans-serif;color:#fff;letter-spacing:.02em;border:1px solid rgba(255,255,255,.22);box-shadow:0 10px 22px -8px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.3)}" +
      "[data-projects-grid] .pc .pn{font-size:15.5px;font-weight:600;letter-spacing:-.01em;margin-top:13px;color:var(--tx,#ededf2)}" +
      "[data-projects-grid] .pc .pcl{font-size:12px;color:var(--tx2,#a1a1aa);margin-top:4px}" +
      "[data-projects-grid] .pc .pchips{margin-top:12px}" +
      "[data-projects-grid] .pc .sp{font-family:'JetBrains Mono',monospace;font-size:10.5px;padding:4px 11px;border-radius:999px;border:1px solid var(--line2,rgba(255,255,255,.14));color:var(--tx2,#a1a1aa);display:inline-flex;align-items:center;gap:6px}" +
      "[data-projects-grid] .pc .d{width:7px;height:7px;border-radius:50%}" +
      "[data-projects-grid] .pc .barwrap{display:flex;align-items:center;gap:9px;width:100%;margin-top:15px}" +
      "[data-projects-grid] .pc .bar{flex:1;height:5px;border-radius:999px;background:rgba(255,255,255,.09);overflow:hidden;margin:0}" +
      "[data-projects-grid] .pc .bar i{display:block;height:100%;border-radius:999px;background:var(--grad-soft,linear-gradient(135deg,#6d5efc,#8b7cff))}" +
      "[data-projects-grid] .pc .pct{font-family:'JetBrains Mono',monospace;font-size:10.5px;color:var(--tx3,#71717a);min-width:30px;text-align:right}" +
      "[data-projects-grid] .pc .pl{display:flex;justify-content:center;gap:13px;margin-top:15px;color:var(--tx3,#71717a);font-size:16px}" +
      "[data-projects-grid] .pc .picon{display:inline-flex;color:inherit;text-decoration:none}" +
      "[data-projects-grid] .pc:hover .picon i{color:var(--tx2,#a1a1aa)}" +
      "[data-projects-grid] .pc .picon:hover i{color:var(--tx,#ededf2)}" +
      "[data-projects-grid] .pc .pfoot{font-family:'JetBrains Mono',monospace;font-size:9.5px;color:var(--tx3,#71717a);letter-spacing:.1em;text-transform:uppercase;margin-top:13px}" +
      "@keyframes ah-cardin{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}" +
      "@media(prefers-reduced-motion:reduce){[data-projects-grid] .pc{animation:none}}";
    document.head.appendChild(s);
  }

  function load() {
    var grids = document.querySelectorAll("[data-projects-grid]");
    if (!grids.length) return;
    injectStyle();
    fetch("/data/projects.json", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var ps = (data.projects || []).filter(function (p) { return !p.hidden; });
        var html = ps.map(card).join("");
        grids.forEach(function (g) { g.innerHTML = html; });
      })
      .catch(function () {
        grids.forEach(function (g) { g.innerHTML = '<p style="width:100%;text-align:center;color:var(--tx3);font-size:13px">Could not load projects.</p>'; });
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load); else load();
})();
