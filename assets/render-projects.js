/* Artist Hub — render project cards from /data/projects.json into any [data-projects-grid].
   Shared by index.html (landing preview) and dashboard.html. No build step.
   Smart, centered card: monogram avatar + soft color glow + centered content. */
(function () {
  var STAGE = { lead: "Lead", planning: "Planning", proposal: "Proposal", design: "Design", development: "Development", qa: "QA / staging", launch: "Launch", maintenance: "Maintenance" };
  var STAGE_ICON = { lead: "ti-flag", planning: "ti-clipboard-list", proposal: "ti-file-description", design: "ti-palette", development: "ti-code", qa: "ti-flask", launch: "ti-rocket", maintenance: "ti-tool" };
  var HEALTH = { on_track: ["#34d399", "On track"], at_risk: ["#fbbf24", "At risk"], blocked: ["#f87171", "Blocked"] };
  var LINKS = [["figma", "ti-brand-figma", "Figma"], ["repo", "ti-brand-github", "Repository"], ["dev", "ti-code", "Dev"], ["staging", "ti-flask", "Staging"], ["live", "ti-world", "Live site"], ["docs", "ti-file-text", "Docs"]];

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fmt(iso) { if (!iso) return ""; try { return new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric" }); } catch (e) { return ""; } }
  function relTime(iso) { if (!iso) return ""; var d = new Date(iso); if (isNaN(d)) return ""; var days = Math.round((Date.now() - d.getTime()) / 864e5); if (days < 0) return fmt(iso); if (days < 1) return "today"; if (days < 2) return "yesterday"; if (days < 30) return days + " days ago"; return fmt(iso); }
  function initials(name) {
    var w = String(name || "?").split(/[\s–—\-]+/).filter(Boolean);
    return ((w[0] ? w[0][0] : "?") + (w[1] ? w[1][0] : "")).toUpperCase();
  }

  function card(p, i) {
    var h = HEALTH[p.health] || HEALTH.on_track;
    var grad = esc(p.coverGradient || "linear-gradient(135deg,#6d5efc,#8b7cff)");
    var SHORT = { figma: "Figma", repo: "Repo", dev: "Dev", staging: "Staging", live: "Live", docs: "Docs" };
    var linkBtns = LINKS.map(function (l) {
      var u = l[0] === "live" ? ((p.links && p.links.live) || (p.deploy && p.deploy.url) || "") : ((p.links && p.links[l[0]]) || "");
      if (!u) return "";
      return '<a class="lbtn' + (l[0] === "live" ? " go" : " io") + '" href="' + esc(u) + '" target="_blank" rel="noopener" aria-label="' + esc(p.name) + " — " + l[2] + '"><i class="ti ' + l[1] + '" aria-hidden="true"></i>' + (l[0] === "live" ? SHORT[l[0]] : "") + "</a>";
    }).join("");
    var updated = relTime((p.deploy && p.deploy.lastDeployed) || (p.repoInfo && p.repoInfo.lastCommitDate) || "");
    var lang = (p.repoInfo && p.repoInfo.language) || "";
    var prs = (p.repoInfo && p.repoInfo.openPRs) || 0;
    var footParts = [];
    if (lang) footParts.push("<span>" + esc(lang) + "</span>");
    if (prs > 0) footParts.push("<span>" + prs + " open PR" + (prs === 1 ? "" : "s") + "</span>");
    var footExtra = footParts.join(" · ");
    var slug = encodeURIComponent(p.slug || "");
    return '' +
      '<div class="pc" data-slug="' + esc(p.slug || "") + '" style="animation-delay:' + (i * 55) + 'ms">' +
        '<div class="pglow" aria-hidden="true" style="background:' + grad + '"></div>' +
        '<div class="pb">' +
          '<a class="pcgo" href="/project.html?slug=' + slug + '" aria-label="Open ' + esc(p.name) + '">' +
            '<div class="pav"><span class="pav-i">' + esc(initials(p.name)) + '</span></div>' +
            '<div class="pn">' + esc(p.name) + "</div>" +
            '<div class="pcl">' + esc(p.client) + (p.type ? " · " + esc(p.type) : "") + "</div>" +
          "</a>" +
          (linkBtns ? '<div class="plinks">' + linkBtns + "</div>" : "") +
          '<div class="pchips">' +
            '<span class="hpill health--' + esc(p.health || 'on_track') + '"><span class="d"></span>' + esc(h[1]) + '</span>' +
            '<span class="g-stage"><i class="ti ' + (STAGE_ICON[p.stage] || 'ti-flag') + '" aria-hidden="true"></i>' + esc(STAGE[p.stage] || p.stage) + '</span>' +
          '</div>' +
          '<div class="progress"><div class="progress-head"><span>Progress</span><b>' + (p.progress == null ? "" : p.progress + "%") + '</b></div><div class="g-bar"><span style="width:' + (p.progress || 0) + '%"></span></div></div>' +
          (updated ? '<div class="g-foot"><i class="ti ti-clock" aria-hidden="true"></i><span>' + esc(updated) + '</span>' + (footExtra ? '<span class="ml">' + footExtra + '</span>' : '') + '</div>' : "") +
        "</div>" +
      "</div>";
  }

  function injectStyle() {
    if (document.getElementById("ah-proj-style")) return;
    var s = document.createElement("style");
    s.id = "ah-proj-style";
    s.textContent =
      "[data-projects-grid]{display:flex!important;flex-wrap:wrap;justify-content:center;align-items:flex-start;gap:var(--space-4,16px)}" +
      "[data-projects-grid] .pc{position:relative;flex:0 0 236px;max-width:236px;border-radius:var(--r-xl,16px);overflow:hidden;text-align:center;cursor:pointer;display:flex;flex-direction:column;animation:ah-cardin .55s cubic-bezier(.34,1.56,.64,1) both}" +
      "[data-projects-grid] .pc .pcgo{display:block;text-decoration:none;color:inherit}" +
      "[data-projects-grid] .pc .pglow{position:absolute;top:-12px;left:0;right:0;height:100px;opacity:.1;filter:blur(26px);pointer-events:none}" +
      "[data-projects-grid] .pc .pb{position:relative;z-index:1;flex:1;display:flex;flex-direction:column;align-items:stretch;padding:var(--space-6,24px) var(--space-4,16px) var(--space-4,16px)}" +
      "[data-projects-grid] .pc .pav{width:40px;height:40px;border-radius:var(--r-lg,12px);display:grid;place-items:center;background:rgba(255,255,255,.05);border:1px solid var(--line,rgba(255,255,255,.08));box-shadow:none;margin:0 auto}" +
      "[data-projects-grid] .pc .pav-i{font:700 var(--text-base,14px) 'Inter',system-ui,sans-serif;letter-spacing:.02em;color:var(--accent-soft,#a78bfa)}" +
      "[data-projects-grid] .pc .pn{font-size:var(--text-lg,18px);line-height:1.25;font-weight:700;letter-spacing:-.015em;margin-top:var(--space-4,16px);color:var(--tx,#f4f4f6);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.5em}" +
      "[data-projects-grid] .pc .pcl{font-size:var(--text-sm,12px);color:var(--tx2,#a3a3ae);margin-top:var(--space-1,4px)}" +
      "[data-projects-grid] .pc .pchips{margin:var(--space-3,12px) 0 0;display:flex;align-items:center;gap:var(--space-2,8px)}" +
      "[data-projects-grid] .pc .hpill{font-family:'JetBrains Mono',monospace;font-size:var(--text-xs,11px);font-weight:600;letter-spacing:.2px;padding:var(--space-1,4px) var(--space-2,8px);border-radius:var(--r-pill,999px);display:inline-flex;align-items:center;gap:var(--space-1,4px)}" +
      "[data-projects-grid] .pc .hpill .d{width:6px;height:6px;border-radius:var(--r-circle,50%)}" +
      "[data-projects-grid] .pc .hpill.health--on_track{color:var(--health-on,#6ee7b7);background:var(--health-on-bg,rgba(52,211,153,.12));border-color:rgba(52,211,153,.30)}" +
      "[data-projects-grid] .pc .hpill.health--on_track .d{background:var(--health-on-dot,#34d399);box-shadow:0 0 6px var(--health-on-dot,#34d399)}" +
      "[data-projects-grid] .pc .hpill.health--at_risk{color:var(--health-risk,#fcd34d);background:var(--health-risk-bg,rgba(251,191,36,.13));border-color:rgba(251,191,36,.32)}" +
      "[data-projects-grid] .pc .hpill.health--at_risk .d{background:var(--health-risk-dot,#fbbf24);box-shadow:0 0 6px var(--health-risk-dot,#fbbf24)}" +
      "[data-projects-grid] .pc .hpill.health--blocked{color:var(--health-blk,#fca5a5);background:var(--health-blk-bg,rgba(248,113,113,.14));border-color:rgba(248,113,113,.34)}" +
      "[data-projects-grid] .pc .hpill.health--blocked .d{background:var(--health-blk-dot,#f87171);box-shadow:0 0 6px var(--health-blk-dot,#f87171)}" +
      "[data-projects-grid] .pc .g-stage{margin-left:auto;display:inline-flex;align-items:center;gap:var(--space-1,4px);font-family:'JetBrains Mono',monospace;font-size:var(--text-xs,11px);color:var(--tx2,#a3a3ae)}" +
      "[data-projects-grid] .pc .g-stage i{font-size:var(--text-base,14px);color:var(--accent-soft,#a78bfa)}" +
      "[data-projects-grid] .pc .progress{display:flex;flex-direction:column;gap:var(--space-2,8px);margin-top:var(--space-3,12px)}" +
      "[data-projects-grid] .pc .progress-head{display:flex;justify-content:space-between;align-items:baseline;font-family:'JetBrains Mono',monospace;font-size:var(--text-xs,11px);letter-spacing:.3px;color:var(--tx3,#8a8a96);text-transform:uppercase}" +
      "[data-projects-grid] .pc .progress-head b{color:var(--tx,#f4f4f6);font-size:var(--text-sm,12px);font-weight:600}" +
      "[data-projects-grid] .pc .g-bar{height:5px;border-radius:var(--r-pill,999px);background:rgba(255,255,255,.08);overflow:hidden}" +
      "[data-projects-grid] .pc .g-bar span{display:block;height:100%;border-radius:var(--r-pill,999px);background:linear-gradient(90deg,var(--accent,#6d5efc),var(--accent-soft,#a78bfa))}" +
      "[data-projects-grid] .pc .plinks{display:flex;flex-wrap:wrap;justify-content:center;gap:var(--space-2,8px);margin-top:var(--space-4,16px)}" +
      "[data-projects-grid] .pc .lbtn{display:inline-flex;align-items:center;gap:var(--space-2,8px);font-size:var(--text-sm,12px);font-weight:500;color:var(--tx2,#a3a3ae);background:rgba(255,255,255,.06);border:1px solid var(--line2,rgba(255,255,255,.14));border-radius:var(--r-md,8px);padding:var(--space-2,8px) var(--space-3,12px);text-decoration:none;transition:color .2s,background .2s,border-color .2s}" +
      "[data-projects-grid] .pc .lbtn i{font-size:var(--text-base,14px)}" +
      "[data-projects-grid] .pc .lbtn.io{padding:var(--space-2,8px);gap:0}" +
      "[data-projects-grid] .pc .lbtn:hover{color:var(--tx,#f4f4f6);background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.24)}" +
      "[data-projects-grid] .pc .lbtn.go{color:var(--lime,#d6ff4f);border-color:rgba(214,255,79,.35);background:rgba(214,255,79,.07)}" +
      "[data-projects-grid] .pc .lbtn.go:hover{color:var(--lime,#d6ff4f);background:rgba(214,255,79,.14);border-color:rgba(214,255,79,.5)}" +
      "[data-projects-grid] .pc .pcgo:focus-visible{outline:none;box-shadow:inset 0 0 0 2px var(--accent,#6d5efc);border-radius:var(--r-xl,16px)}" +
      "[data-projects-grid] .pc .lbtn:focus-visible{outline:none;box-shadow:0 0 0 2px var(--accent,#6d5efc)}" +
      "[data-projects-grid] .pc .g-foot{display:flex;align-items:center;gap:var(--space-2,8px);padding-top:var(--space-3,12px);margin-top:var(--space-3,12px);border-top:1px solid rgba(255,255,255,.08);font-family:'JetBrains Mono',monospace;font-size:var(--text-xs,11px);color:var(--tx3,#8a8a96)}" +
      "[data-projects-grid] .pc .g-foot i{font-size:var(--text-sm,12px)}" +
      "[data-projects-grid] .pc .g-foot .ml{margin-left:auto;color:var(--tx2,#a3a3ae)}" +
      "[data-projects-grid] .pc-state{flex:1 1 100%;display:flex;flex-direction:column;align-items:center;gap:var(--space-3,12px);text-align:center;padding:var(--space-12,48px) var(--space-4,16px);color:var(--tx3,#8a8a96);font-size:var(--text-base,14px)}" +
      "[data-projects-grid] .pc-state i{font-size:var(--text-4xl,38px);opacity:.55}" +
      "[data-projects-grid] .pc-state .ti-loader-2{animation:ah-spin .9s linear infinite}" +
      "[data-projects-grid] .pc-state .pc-retry{margin-top:var(--space-1,4px);font:inherit;color:var(--tx,#f4f4f6);background:rgba(255,255,255,.06);border:1px solid var(--line2,rgba(255,255,255,.14));border-radius:var(--r-md,8px);padding:var(--space-2,8px) var(--space-4,16px);cursor:pointer;transition:background .2s}" +
      "[data-projects-grid] .pc-state .pc-retry:hover{background:rgba(255,255,255,.1)}" +
      "@keyframes ah-cardin{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}" +
      "@keyframes ah-spin{to{transform:rotate(360deg)}}" +
      "@media(prefers-reduced-motion:reduce){[data-projects-grid] .pc{animation:none}[data-projects-grid] .pc-state .ti-loader-2{animation:none}}";
    document.head.appendChild(s);
  }

  function setState(g, icon, msg, retry) {
    g.innerHTML = '<div class="pc-state" role="status"><i class="ti ' + icon + '" aria-hidden="true"></i><span>' + msg + '</span>' + (retry ? '<button class="pc-retry" type="button">Retry</button>' : '') + '</div>';
    if (retry) { var b = g.querySelector(".pc-retry"); if (b) b.addEventListener("click", load); }
  }
  function load() {
    var grids = document.querySelectorAll("[data-projects-grid]");
    if (!grids.length) return;
    injectStyle();
    grids.forEach(function (g) { setState(g, "ti-loader-2", "Loading projects...", false); });
    fetch("/data/projects.json", { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
      .then(function (data) {
        var ps = (data.projects || []).filter(function (p) { return !p.hidden; });
        if (!ps.length) { grids.forEach(function (g) { setState(g, "ti-folder-open", "No projects to show yet.", false); }); return; }
        var html = ps.map(card).join("");
        grids.forEach(function (g) {
          g.innerHTML = html;
          g.addEventListener("click", function (ev) {
            if (ev.target.closest("a")) return;
            var c = ev.target.closest(".pc[data-slug]");
            if (c && c.getAttribute("data-slug")) location.href = "/project.html?slug=" + encodeURIComponent(c.getAttribute("data-slug"));
          });
        });
      })
      .catch(function () {
        grids.forEach(function (g) { setState(g, "ti-alert-triangle", "Couldn't load projects.", true); });
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load); else load();
})();
