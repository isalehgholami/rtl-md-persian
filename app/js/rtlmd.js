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

	// Table of contents. marked 0.3.5 builds ids from ASCII only, so Persian headings
	// would collide; give every heading a positional id instead.
	var tocs = [
		{ nav: $('toc'), btn: $('toc-toggle'), article: output, prefix: 'p' },
		{ nav: $('reader-toc'), btn: $('reader-toc-toggle'), article: readerOut, prefix: 'r' }
	];

	function buildToc(t) {
		var heads = t.article.querySelectorAll('h1,h2,h3,h4,h5,h6');
		var root = document.createElement('ul');
		var stack = [{ level: 0, ul: root }];
		Array.prototype.forEach.call(heads, function (h, i) {
			h.id = 'h-' + t.prefix + '-' + i;
			var level = +h.tagName.charAt(1);
			while (stack[stack.length - 1].level >= level) stack.pop();
			var parent = stack[stack.length - 1];
			if (!parent.ul) {
				parent.ul = document.createElement('ul');
				parent.li.appendChild(parent.ul);
				parent.li.classList.add('has-sub');
				var tg = document.createElement('button');
				tg.type = 'button';
				tg.className = 'toc-toggle';
				tg.setAttribute('aria-label', 'باز/بسته کردن زیرعنوان‌ها');
				tg.setAttribute('aria-expanded', 'true');
				parent.li.insertBefore(tg, parent.li.firstChild);
			}
			var li = document.createElement('li');
			var a = document.createElement('a');
			a.href = '#' + h.id;
			a.dataset.target = h.id;
			a.textContent = h.textContent.trim() || '(بدون عنوان)';
			li.appendChild(a);
			parent.ul.appendChild(li);
			stack.push({ level: level, li: li });
		});
		t.nav.innerHTML = '';
		if (!heads.length) {
			var empty = document.createElement('p');
			empty.className = 'toc-empty';
			empty.textContent = 'عنوانی در متن پیدا نشد.';
			t.nav.appendChild(empty);
		} else t.nav.appendChild(root);
	}

	function setToc(t, open) {
		t.nav.hidden = !open;
		t.btn.setAttribute('aria-expanded', open ? 'true' : 'false');
	}

	tocs.forEach(function (t) {
		t.btn.addEventListener('click', function (e) { e.stopPropagation(); setToc(t, t.nav.hidden); });
		t.nav.addEventListener('click', function (e) {
			var tg = e.target.closest('.toc-toggle');
			if (tg) {
				var li = tg.parentNode, collapsed = li.classList.toggle('collapsed');
				tg.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
				return;
			}
			var a = e.target.closest('a');
			if (!a) return;
			e.preventDefault();
			var el = document.getElementById(a.dataset.target);
			setToc(t, false);
			if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
		});
	});
	document.addEventListener('click', function (e) {
		tocs.forEach(function (t) {
			if (!t.nav.hidden && !t.nav.contains(e.target) && !t.btn.contains(e.target)) setToc(t, false);
		});
	});

	function render() {
		var html = marked(protectPipes(source.value)).split(PIPE).join('|');
		output.innerHTML = html;
		buildToc(tocs[0]);
		if (!reader.hidden) { readerOut.innerHTML = html; buildToc(tocs[1]); }
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
		buildToc(tocs[1]);
		setToc(tocs[1], false);
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
		if (e.key !== 'Escape') return;
		var openToc = tocs.filter(function (t) { return !t.nav.hidden; })[0];
		if (openToc) { setToc(openToc, false); return; }
		if (!reader.hidden && !document.fullscreenElement) closeReader();
	});

	// Load a markdown file (button or drag & drop onto the editor)
	var fileInput = $('file-input');
	function loadFile(file) {
		if (!file) return;
		var fr = new FileReader();
		fr.onload = function () {
			source.value = String(fr.result).replace(/^﻿/, '');
			store('content', source.value);
			source.scrollTop = 0;
			output.scrollTop = 0;
			render();
		};
		fr.onerror = function () { alert('خواندن فایل ممکن نشد.'); };
		fr.readAsText(file, 'utf-8');
	}
	$('btn-open').addEventListener('click', function () { fileInput.click(); });
	fileInput.addEventListener('change', function () {
		loadFile(fileInput.files[0]);
		fileInput.value = '';
	});
	source.addEventListener('dragover', function (e) {
		if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types, 'Files') >= 0) {
			e.preventDefault();
			source.classList.add('dragging');
		}
	});
	['dragleave', 'drop'].forEach(function (n) {
		source.addEventListener(n, function () { source.classList.remove('dragging'); });
	});
	source.addEventListener('drop', function (e) {
		if (e.dataTransfer && e.dataTransfer.files.length) {
			e.preventDefault();
			loadFile(e.dataTransfer.files[0]);
		}
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
