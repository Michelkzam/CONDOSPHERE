function sw(i, b) {
    document.querySelectorAll('.ges-panel').forEach(function(p, x) { p.style.display = x === i ? 'block' : 'none'; });
    document.querySelectorAll('#ges-tabs .subtab').forEach(function(t) { t.classList.remove('active'); });
    b.classList.add('active');
}
