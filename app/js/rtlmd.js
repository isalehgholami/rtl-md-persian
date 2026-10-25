(function () {
	'use strict';

	var FALLBACK = '# سلام دنیا\n\nاین یک نوشتار آزمایشی برای نمایش قابلیت‌های **مارک‌داون** است.\n\n' +
		'| نام | نقش | وضعیت |\n|---|---|---|\n| سارا | توسعه‌دهنده | فعال |\n| علی | طراح | فعال |\n\n' +
		'```javascript\nalert("Hello World")\n```\n';

	var $ = function (id) { return document.getElementById(id); };
	var source = $('source'), output = $('output'), readerOut = $('reader-output');
	var reader = $('reader'), root = document.documentElement;

	function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }

	// Renderer: wrap tables so they scroll instead of overflowing the page.
	var renderer = new marked.Renderer();
	renderer.table = function (head, body) {
		return '<div class="table-wrap"><table><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>';
	};
	marked.setOptions({ renderer: renderer, gfm: true, tables: true, breaks: false });

	// marked 0.3.5 splits table rows on every "|", even escaped (\|) or inside `code`,
	// which adds phantom cells. Swap those pipes for a placeholder (restored after render) on table lines first.
	var PIPE = '';
	function protectPipes(md) {
		return md.split('\n').map(function (line) {
			if (line.trim().charAt(0) !== '|') return line;
			return line
				.replace(/\\\|/g, PIPE)
				.replace(/`[^`]*`/g, function (m) { return m.replace(/\|/g, PIPE); });
		}).join('\n');
	}

	function render() {
		var html = marked(protectPipes(source.value)).split(PIPE).join('|');
		output.innerHTML = html;
		if (!reader.hidden) readerOut.innerHTML = html;
		var words = (source.value.trim().match(/\S+/g) || []).length;
		$('count').textContent = words.toLocaleString('fa-IR') + ' کلمه';
	}

	var timer;
	function schedule() {
		clearTimeout(timer);
		timer = setTimeout(function () { store('content', source.value); render(); }, 120);
	}

	// Direction
	function setDir(dir) {
		output.setAttribute('dir', dir);
		readerOut.setAttribute('dir', dir);
		source.setAttribute('dir', dir);
		$('dir-label').textContent = dir.toUpperCase();
		store('dir', dir);
	}
	$('btn-dir').addEventListener('click', function () {
		setDir(source.getAttribute('dir') === 'rtl' ? 'ltr' : 'rtl');
	});

	// Theme
	$('btn-theme').addEventListener('click', function () {
		var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
		root.setAttribute('data-theme', next);
		store('theme', next);
	});

	// Copy HTML
	$('btn-copy').addEventListener('click', function () {
		var label = this.querySelector('span'), old = label.textContent, html = output.innerHTML;
		var done = function () { label.textContent = 'کپی شد ✓'; setTimeout(function () { label.textContent = old; }, 1400); };
		if (navigator.clipboard) navigator.clipboard.writeText(html).then(done);
		else { var t = document.createElement('textarea'); t.value = html; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); done(); }
	});

	// Full-screen render
	function openReader() {
		readerOut.innerHTML = output.innerHTML;
		reader.hidden = false;
		document.body.classList.add('no-scroll');
		$('reader-close').focus();
	}
	function closeReader() {
		if (document.fullscreenElement) document.exitFullscreen();
		reader.hidden = true;
		document.body.classList.remove('no-scroll');
		$('btn-render').focus();
	}
	$('btn-render').addEventListener('click', openReader);
	$('reader-close').addEventListener('click', closeReader);
	$('reader-fs').addEventListener('click', function () {
		if (document.fullscreenElement) document.exitFullscreen();
		else if (reader.requestFullscreen) reader.requestFullscreen();
	});
	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape' && !reader.hidden && !document.fullscreenElement) closeReader();
	});

	source.addEventListener('input', schedule);

	// Init
	setDir(store('dir') || 'rtl');
	var saved = store('content');
	if (saved !== null && saved !== '') {
		source.value = saved; render();
	} else {
		source.value = FALLBACK; render();
		if (window.fetch) {
			fetch('initcontent.md').then(function (r) { return r.ok ? r.text() : Promise.reject(); })
				.then(function (t) { if (source.value === FALLBACK) { source.value = t.replace(/^﻿/, ''); render(); } })
				.catch(function () {});
		}
	}
}());
