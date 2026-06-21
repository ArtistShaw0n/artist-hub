/* Artist Hub — render project cards from /data/projects.json into any [data-projects-grid].
   Used by both index.html (landing preview) and dashboard.html. No build step. */
(function () {
  var STAGE = { lead: "Lead", planning: "Planning", proposal: "Proposal", design: "Design", development: "Development", qa: "QA / staging", launch: "Launch", maintenance: "Maintenance" };
  var HEALTH = { on_track: ["#34d399", "On track"], at_risk: ["#fbbf24", "At risk"], blocked: ["#f87171", "Blocked"] };
  var LINKS = [["figma", "ti-brand-figma", "Figma"], ["repo", "ti-brand-github", "Repository"], ["dev", "ti-code", "Dev"], ["staging", "ti-flask", "Staging"], ["live", "ti-world", "Live site"], ["docs", "ti-file-text", "Docs"]];

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fmt(iso) { if (!iso) return ""; try { return new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric" }); } catch (e) { return ""; } }

  function card(p, i) {
    var h = HEALTH[p.health] || HEALTH.on_track;
    var links = LINKS.filter(function (l) { return p.links && p.links[l[0]]; }).map(function (l) {
      return '<a class="picon" href="' + esc(p.links[l[0]]) + '" target="_blank" rel="noopener" aria-label="' + esc(p.name) + " — " + l[2] + '"><i class="ti ' + l[1] + '" aria-hidden="true"></i></a>';
    }).join("");
    var date = fmt(p.deploy && p.deploy.lastDeployed) || fmt(p.repoInfo && p.repoInfo.lastCommitDate);
    var meta = date ? '<span class="due"><i class="ti ti-calendar" aria-hidden="true"></i>' + date + "</span>" : "";
    return '' +
      '<div class="pc" style="animation-delay:' + (i * 60) + 'ms">' +
        '<div class="cov" style="background:' + esc(p.coverGradient || "linear-gradient(135deg,#334155,#64748b)") + '">' +
          '<span class="ptype">' + esc((p.type || "").toUpperCase()) + "</span>" +
          '<span class="hp"><span class="d" style="background:' + h[0] + '"></span>' + h[1] + "</span>" +
        "</div>" +
        '<div class="pb">' +
          '<div class="pn">' + esc(p.name) + "</div>" +
          '<div class="pcl">' + esc(p.client) + "</div>" +
          '<div class="pr"><span class="sp">' + esc(STAGE[p.stage] || p.stage) + '</span><span class="pct">' + (p.progress == null ? "" : p.progress + "%") + "</span></div>" +
          '<div class="bar"><i style="width:' + (p.progress || 0) + '%"></i></div>' +
          '<div class="pl">' + links + meta + "</div>" +
        "</div>" +
      "</div>";
  }

  function injectStyle() {
    if (document.getElementById("ah-proj-style")) return;
    var s = document.createElement("style");
    s.id = "ah-proj-style";
    s.textContent =
      "@keyframes ah-cardin{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}" +
      "[data-projects-grid] .pc{animation:ah-cardin .55s cubic-bezier(.34,1.56,.64,1) both}" +
      "[data-projects-grid] .picon{display:inline-flex;text-decoration:none;color:inherit}" +
      "[data-projects-grid] .picon:hover i{color:var(--tx)}" +
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
        grids.forEach(function (g) { g.innerHTML = '<p style="grid-column:1/-1;color:var(--tx3);font-size:13px">Could not load projects.</p>'; });
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load); else load();
})();
