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
    var SHORT = { figma: "Figma", repo: "Repo", dev: "Dev", staging: "Staging", live: "Live", docs: "Docs" };
    var linkBtns = LINKS.map(function (l) {
      var u = l[0] === "live" ? ((p.links && p.links.live) || (p.deploy && p.deploy.url) || "") : ((p.links && p.links[l[0]]) || "");
      if (!u) return "";
      return '<a class="lbtn' + (l[0] === "live" ? " go" : "") + '" href="' + esc(u) + '" target="_blank" rel="noopener" aria-label="' + esc(p.name) + " — " + l[2] + '"><i class="ti ' + l[1] + '" aria-hidden="true"></i>' + SHORT[l[0]] + "</a>";
    }).join("");
    var date = fmt(p.deploy && p.deploy.lastDeployed) || fmt(p.repoInfo && p.repoInfo.lastCommitDate);
    var slug = encodeURIComponent(p.slug || "");
    return '' +
      '<div class="pc" data-slug="' + esc(p.slug || "") + '" style="animation-delay:' + (i * 55) + 'ms">' +
        '<div class="pglow" aria-hidden="true" style="background:' + grad + '"></div>' +
        '<div class="pb">' +
          '<div class="pchips">' +
            '<span class="hpill health--' + esc(p.health || 'on_track') + '"><span class="d"></span>' + esc(h[1]) + '</span>' +
            '<span class="sp">' + esc(STAGE[p.stage] || p.stage) + '</span>' +
          '</div>' +
          '<a class="pcgo" href="/project.html?slug=' + slug + '" aria-label="Open ' + esc(p.name) + '">' +
            '<div class="pav"><span class="pav-i">' + esc(initials(p.name)) + '</span></div>' +
            '<div class="pn">' + esc(p.name) + "</div>" +
            '<div class="pcl">' + esc(p.client) + (p.type ? " · " + esc(p.type) : "") + "</div>" +
          "</a>" +
          (linkBtns ? '<div class="plinks">' + linkBtns + "</div>" : "") +
          '<div class="barwrap"><span class="bar"><i style="width:' + (p.progress || 0) + '%"></i></span><span class="pct">' + (p.progress == null ? "" : p.progress + "%") + "</span></div>" +
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
      "[data-projects-grid] .pc{position:relative;flex:0 0 236px;max-width:236px;border-radius:18px;overflow:hidden;text-align:center;cursor:pointer;animation:ah-cardin .55s cubic-bezier(.34,1.56,.64,1) both}" +
      "[data-projects-grid] .pc .pcgo{display:block;text-decoration:none;color:inherit}" +
      "[data-projects-grid] .pc .pglow{position:absolute;top:-12px;left:0;right:0;height:100px;opacity:.20;filter:blur(26px);pointer-events:none}" +
      "[data-projects-grid] .pc .pb{position:relative;z-index:1;display:flex;flex-direction:column;align-items:stretch;padding:22px 18px 18px}" +
      "[data-projects-grid] .pc .pav{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:rgba(255,255,255,.05);border:1px solid var(--line,rgba(255,255,255,.08));box-shadow:none;margin:0 auto}" +
      "[data-projects-grid] .pc .pav-i{font:700 14px 'Inter',system-ui,sans-serif;letter-spacing:.02em;color:var(--accent-soft,#a78bfa)}" +
      "[data-projects-grid] .pc .pn{font-size:17px;line-height:1.25;font-weight:700;letter-spacing:-.015em;margin-top:14px;color:var(--tx,#f4f4f6)}" +
      "[data-projects-grid] .pc .pcl{font-size:11.5px;color:var(--tx2,#a3a3ae);margin-top:5px}" +
      "[data-projects-grid] .pc .pchips{margin:0 0 16px;display:flex;justify-content:center;align-items:center;gap:6px;flex-wrap:wrap}" +
      "[data-projects-grid] .pc .hpill{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.04em;text-transform:uppercase;padding:4px 10px;border-radius:999px;display:inline-flex;align-items:center;gap:6px;border:1px solid transparent}" +
      "[data-projects-grid] .pc .hpill .d{width:6px;height:6px;border-radius:50%}" +
      "[data-projects-grid] .pc .hpill.health--on_track{color:#6ee7b7;background:rgba(52,211,153,.12);border-color:rgba(52,211,153,.30)}" +
      "[data-projects-grid] .pc .hpill.health--on_track .d{background:#34d399}" +
      "[data-projects-grid] .pc .hpill.health--at_risk{color:#fcd34d;background:rgba(251,191,36,.13);border-color:rgba(251,191,36,.32)}" +
      "[data-projects-grid] .pc .hpill.health--at_risk .d{background:#fbbf24}" +
      "[data-projects-grid] .pc .hpill.health--blocked{color:#fca5a5;background:rgba(248,113,113,.14);border-color:rgba(248,113,113,.34)}" +
      "[data-projects-grid] .pc .hpill.health--blocked .d{background:#f87171}" +
      "[data-projects-grid] .pc .sp{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.04em;text-transform:uppercase;padding:4px 10px;border-radius:999px;border:1px solid var(--line,rgba(255,255,255,.08));color:var(--tx3,#8a8a96);background:rgba(255,255,255,.03)}" +
      "[data-projects-grid] .pc .barwrap{display:flex;align-items:center;gap:9px;width:100%;margin-top:15px}" +
      "[data-projects-grid] .pc .bar{flex:1;height:5px;border-radius:999px;background:rgba(255,255,255,.09);overflow:hidden;margin:0}" +
      "[data-projects-grid] .pc .bar i{display:block;height:100%;border-radius:999px;background:var(--grad-soft,linear-gradient(135deg,#6d5efc,#8b7cff))}" +
      "[data-projects-grid] .pc .pct{font-family:'JetBrains Mono',monospace;font-size:10.5px;color:var(--tx3,#71717a);min-width:30px;text-align:right}" +
      "[data-projects-grid] .pc .plinks{display:flex;flex-wrap:wrap;justify-content:center;gap:7px;margin-top:15px}" +
      "[data-projects-grid] .pc .lbtn{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:500;color:var(--tx2,#a3a3ae);background:rgba(255,255,255,.06);border:1px solid var(--line2,rgba(255,255,255,.14));border-radius:9px;padding:7px 10px;text-decoration:none;transition:color .2s,background .2s,border-color .2s}" +
      "[data-projects-grid] .pc .lbtn i{font-size:14px}" +
      "[data-projects-grid] .pc .lbtn:hover{color:var(--tx,#f4f4f6);background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.24)}" +
      "[data-projects-grid] .pc .lbtn.go{color:var(--lime,#d6ff4f);border-color:rgba(214,255,79,.35);background:rgba(214,255,79,.07)}" +
      "[data-projects-grid] .pc .lbtn.go:hover{color:var(--lime,#d6ff4f);background:rgba(214,255,79,.14);border-color:rgba(214,255,79,.5)}" +
      "[data-projects-grid] .pc .pcgo:focus-visible{outline:none;box-shadow:inset 0 0 0 2px var(--accent,#6d5efc);border-radius:14px}" +
      "[data-projects-grid] .pc .lbtn:focus-visible{outline:none;box-shadow:0 0 0 2px var(--accent,#6d5efc)}" +
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
        grids.forEach(function (g) { g.innerHTML = '<p style="width:100%;text-align:center;color:var(--tx3);font-size:13px">Could not load projects.</p>'; });
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load); else load();
})();
